const crypto = require('crypto');
const mongoose = require('mongoose');
const { Product, ProductImage, Order, OrderItem } = require('../db');
const { getStripe } = require('../utils/stripeClient');
const { primaryProductImageUrl, lineItemDisplayName } = require('../utils/productDisplay');

function generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${date}-${suffix}`;
}

function mapStripeAddress(addr) {
    if (!addr) {
        return null;
    }
    return {
        line1: addr.line1 || null,
        line2: addr.line2 || null,
        city: addr.city || null,
        state: addr.state || null,
        postal_code: addr.postal_code || null,
        country: addr.country || null
    };
}

function lineItemProductId(li) {
    const product = li.price?.product;
    if (product && typeof product === 'object' && product.metadata?.product_id) {
        return String(product.metadata.product_id);
    }
    return null;
}

function lineItemDescription(li) {
    if (li.description) {
        return String(li.description);
    }
    const product = li.price?.product;
    if (product && typeof product === 'object' && product.name) {
        return String(product.name);
    }
    return 'Item';
}

/**
 * @param {string} sessionId
 * @returns {Promise<import('stripe').Stripe.LineItem[]>}
 */
async function fetchAllStripeLineItems(sessionId) {
    const stripe = getStripe();
    const rows = [];
    let startingAfter;

    do {
        const page = await stripe.checkout.sessions.listLineItems(sessionId, {
            limit: 100,
            starting_after: startingAfter,
            expand: ['data.price.product']
        });
        rows.push(...page.data);
        if (page.has_more && page.data.length) {
            startingAfter = page.data[page.data.length - 1].id;
        } else {
            startingAfter = undefined;
        }
    } while (startingAfter);

    return rows;
}

/**
 * @param {import('stripe').Stripe.LineItem[]} lineItems
 */
function qtyByProductFromStripeLines(lineItems) {
    const map = new Map();
    for (const li of lineItems) {
        const productId = lineItemProductId(li);
        if (!productId) {
            continue;
        }
        const qty = li.quantity || 0;
        map.set(productId, (map.get(productId) || 0) + qty);
    }
    return map.size ? map : null;
}

/**
 * @param {import('stripe').Stripe.LineItem[]} lineItems
 */
function stripeMetaByProductId(lineItems) {
    const map = new Map();
    for (const li of lineItems) {
        const productId = lineItemProductId(li);
        if (!productId) {
            continue;
        }
        const qty = li.quantity || 0;
        const unit = li.price && typeof li.price.unit_amount === 'number' ? li.price.unit_amount : 0;
        const lineTotal =
            typeof li.amount_subtotal === 'number' ? li.amount_subtotal : unit * qty;
        const desc = lineItemDescription(li);

        const existing = map.get(productId);
        if (existing) {
            existing.quantity += qty;
            existing.stripe_line_total_cents += lineTotal;
            if (!existing.stripe_description.includes(desc)) {
                existing.stripe_description =
                    existing.stripe_description + ', ' + desc;
            }
        } else {
            map.set(productId, {
                quantity: qty,
                stripe_description: desc,
                stripe_unit_amount_cents: unit,
                stripe_line_total_cents: lineTotal
            });
        }
    }
    return map;
}

/**
 * Fallback when Stripe product metadata is missing — parse session.metadata.items_json.
 */
function itemsFromSessionMetadata(session) {
    const raw = session.metadata?.items_json;
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return null;
        }
        const map = new Map();
        parsed.forEach((row) => {
            if (row && row.product_id && row.quantity) {
                map.set(String(row.product_id), Number(row.quantity));
            }
        });
        return map.size ? map : null;
    } catch {
        return null;
    }
}

function buildStripeSnapshot(session) {
    const shippingDetails = session.shipping_details || null;
    const totalDetails = session.total_details || {};
    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null;
    const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id || null;

    return {
        checkout_session_id: session.id,
        payment_intent_id: paymentIntentId,
        customer_id: stripeCustomerId,
        customer_name:
            shippingDetails?.name || session.customer_details?.name || null,
        customer_email:
            session.customer_details?.email || session.customer_email || null,
        shipping_name: shippingDetails?.name || null,
        shipping_address: mapStripeAddress(
            shippingDetails?.address || session.customer_details?.address
        ),
        amount_subtotal_cents: session.amount_subtotal ?? 0,
        amount_tax_cents: totalDetails.amount_tax ?? 0,
        amount_shipping_cents: totalDetails.amount_shipping ?? 0,
        amount_total_cents: session.amount_total ?? 0,
        currency: (session.currency || 'usd').toLowerCase(),
        recorded_at: new Date()
    };
}

async function loadProductSnapshot(productId) {
    const product = await Product.findOne({
        _id: productId,
        deleted_at: null
    }).lean();
    if (!product) {
        return null;
    }
    const images = await ProductImage.find({
        product_id: productId,
        deleted_at: null
    })
        .sort({ sort_order: 1, created_at: 1 })
        .lean();
    product.product_images = images;
    return product;
}

/**
 * Idempotent fulfillment for a paid Checkout Session.
 * @param {import('stripe').Stripe.Checkout.Session} session
 * @returns {Promise<{ ok: true, orderId: string, duplicate?: boolean } | { ok: false, error: string }>}
 */
async function fulfillOrderFromStripeSession(session) {
    const sessionId = session.id;
    if (!sessionId) {
        return { ok: false, error: 'Missing session id' };
    }

    const existing = await Order.findOne({ stripe_checkout_session_id: sessionId }).lean();
    if (existing) {
        return { ok: true, orderId: String(existing._id), duplicate: true };
    }

    const stripeLines = await fetchAllStripeLineItems(sessionId);
    let qtyByProduct = qtyByProductFromStripeLines(stripeLines);
    const stripeMeta = stripeMetaByProductId(stripeLines);

    if (!qtyByProduct || qtyByProduct.size === 0) {
        qtyByProduct = itemsFromSessionMetadata(session);
    }
    if (!qtyByProduct || qtyByProduct.size === 0) {
        return { ok: false, error: 'Could not resolve line items from checkout session' };
    }

    const stripeSnapshot = buildStripeSnapshot(session);
    const currency = stripeSnapshot.currency;
    const customerEmail = stripeSnapshot.customer_email;
    const customerName = stripeSnapshot.customer_name;
    const paymentIntentId = stripeSnapshot.payment_intent_id;
    const stripeCustomerId = stripeSnapshot.customer_id;
    const shippingAddress = stripeSnapshot.shipping_address;

    const subtotalCents = stripeSnapshot.amount_subtotal_cents;
    const taxCents = stripeSnapshot.amount_tax_cents;
    const shippingCents = stripeSnapshot.amount_shipping_cents;
    const totalCents = stripeSnapshot.amount_total_cents;

    const dbSession = await mongoose.startSession();
    try {
        let orderId = null;
        let wasDuplicate = false;

        await dbSession.withTransaction(
            async () => {
                const duplicateInTx = await Order.findOne({
                    stripe_checkout_session_id: sessionId
                })
                    .session(dbSession)
                    .lean();
                if (duplicateInTx) {
                    orderId = String(duplicateInTx._id);
                    wasDuplicate = true;
                    return;
                }

                const orderItems = [];
                let computedSubtotal = 0;

                for (const [productId, quantity] of qtyByProduct.entries()) {
                    const product = await loadProductSnapshot(productId);
                    if (!product) {
                        throw new Error(`Product ${productId} no longer exists`);
                    }

                    const updated = await Product.findOneAndUpdate(
                        {
                            _id: productId,
                            is_active: true,
                            deleted_at: null,
                            quantity_available: { $gte: quantity }
                        },
                        { $inc: { quantity_available: -quantity } },
                        { new: true, session: dbSession }
                    );

                    if (!updated) {
                        throw new Error(
                            `Insufficient stock for ${product.title || productId} (need ${quantity})`
                        );
                    }

                    const unitPrice = product.price_cents;
                    const lineTotal = unitPrice * quantity;
                    computedSubtotal += lineTotal;

                    const stripeRow = stripeMeta.get(productId);

                    orderItems.push({
                        product_id: product._id,
                        product_title: lineItemDisplayName(product),
                        product_slug: product.slug,
                        image_url: primaryProductImageUrl(product),
                        size_label: product.size_label || null,
                        unit_price_cents: unitPrice,
                        quantity,
                        line_total_cents: lineTotal,
                        stripe_description: stripeRow?.stripe_description || null,
                        stripe_unit_amount_cents: stripeRow?.stripe_unit_amount_cents ?? null,
                        stripe_line_total_cents: stripeRow?.stripe_line_total_cents ?? null
                    });
                }

                const orderNumber = generateOrderNumber();
                const [order] = await Order.create(
                    [
                        {
                            order_number: orderNumber,
                            customer_email: customerEmail,
                            customer_name: customerName,
                            stripe_checkout_session_id: sessionId,
                            stripe_payment_intent_id: paymentIntentId,
                            stripe_customer_id: stripeCustomerId,
                            status: 'paid',
                            payment_status: 'paid',
                            fulfillment_status: 'new_order',
                            subtotal_cents: subtotalCents || computedSubtotal,
                            tax_cents: taxCents,
                            shipping_cents: shippingCents,
                            total_cents: totalCents || computedSubtotal + taxCents + shippingCents,
                            currency,
                            shipping_address: shippingAddress,
                            billing_address: shippingAddress,
                            stripe_snapshot: stripeSnapshot
                        }
                    ],
                    { session: dbSession }
                );

                const itemDocs = orderItems.map((row) => ({
                    ...row,
                    order_id: order._id
                }));
                await OrderItem.insertMany(itemDocs, { session: dbSession });
                orderId = String(order._id);
            },
            { readPreference: 'primary' }
        );

        if (!orderId) {
            return { ok: false, error: 'Order was not created' };
        }

        return {
            ok: true,
            orderId,
            duplicate: wasDuplicate || undefined
        };
    } catch (err) {
        if (err && err.code === 11000) {
            const dup = await Order.findOne({ stripe_checkout_session_id: sessionId }).lean();
            if (dup) {
                return { ok: true, orderId: String(dup._id), duplicate: true };
            }
        }
        const msg = err && err.message ? String(err.message) : 'Fulfillment failed';
        return { ok: false, error: msg };
    } finally {
        await dbSession.endSession();
    }
}

module.exports = {
    fulfillOrderFromStripeSession,
    generateOrderNumber
};
