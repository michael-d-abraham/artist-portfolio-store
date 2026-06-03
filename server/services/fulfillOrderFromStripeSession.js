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

/**
 * Build quantity map from Stripe line items (product_id in price.product.metadata).
 * @param {import('stripe').Stripe.Checkout.Session} session
 */
async function lineItemsByProductId(sessionId) {
    const stripe = getStripe();
    const map = new Map();

    let startingAfter;
    do {
        const page = await stripe.checkout.sessions.listLineItems(sessionId, {
            limit: 100,
            starting_after: startingAfter,
            expand: ['data.price.product']
        });

        for (const li of page.data) {
            const productId =
                li.price?.product?.metadata?.product_id ||
                (typeof li.price?.product === 'object' ? li.price.product.metadata?.product_id : null);
            if (!productId) {
                continue;
            }
            const qty = li.quantity || 0;
            map.set(String(productId), (map.get(String(productId)) || 0) + qty);
        }

        if (page.has_more && page.data.length) {
            startingAfter = page.data[page.data.length - 1].id;
        } else {
            startingAfter = undefined;
        }
    } while (startingAfter);

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
 * Idempotent fulfillment for checkout.session.completed.
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

    let qtyByProduct = await lineItemsByProductId(sessionId);
    if (!qtyByProduct || qtyByProduct.size === 0) {
        qtyByProduct = itemsFromSessionMetadata(session);
    }
    if (!qtyByProduct || qtyByProduct.size === 0) {
        return { ok: false, error: 'Could not resolve line items from checkout session' };
    }

    const currency = (session.currency || 'usd').toLowerCase();
    const customerEmail =
        session.customer_details?.email || session.customer_email || null;
    const customerName = session.customer_details?.name || null;
    const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null;

    const subtotalCents = session.amount_subtotal ?? 0;
    const taxCents = session.total_details?.amount_tax ?? 0;
    const shippingCents = session.total_details?.amount_shipping ?? 0;
    const totalCents = session.amount_total ?? 0;

    const shippingAddress = mapStripeAddress(
        session.shipping_details?.address || session.customer_details?.address
    );

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

                    orderItems.push({
                        product_id: product._id,
                        product_title: lineItemDisplayName(product),
                        product_slug: product.slug,
                        image_url: primaryProductImageUrl(product),
                        size_label: product.size_label || null,
                        unit_price_cents: unitPrice,
                        quantity,
                        line_total_cents: lineTotal
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
                            subtotal_cents: subtotalCents || computedSubtotal,
                            tax_cents: taxCents,
                            shipping_cents: shippingCents,
                            total_cents: totalCents || computedSubtotal + taxCents + shippingCents,
                            currency,
                            shipping_address: shippingAddress,
                            billing_address: shippingAddress
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
