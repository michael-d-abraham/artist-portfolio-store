const { Product } = require('../db');
const { applyProductRelations } = require('../utils/productPopulate');
const { getStripe } = require('../utils/stripeClient');
const { primaryProductImageUrl, lineItemDisplayName } = require('../utils/productDisplay');
const { parseCheckoutItemsBody } = require('../utils/checkoutValidation');

function clientBaseUrl() {
    const base = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return String(base).replace(/\/$/, '');
}

const CHECKOUT_SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}';

function checkoutSuccessUrl() {
    const base = clientBaseUrl();
    const defaultUrl = `${base}/order-success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`;

    const override = process.env.STRIPE_SUCCESS_URL && String(process.env.STRIPE_SUCCESS_URL).trim();
    if (override) {
        if (!override.includes(CHECKOUT_SESSION_ID_PLACEHOLDER)) {
            console.error(
                '[checkout] STRIPE_SUCCESS_URL must include {CHECKOUT_SESSION_ID}. Using default:',
                defaultUrl
            );
            return defaultUrl;
        }
        return override;
    }

    // Stripe replaces {CHECKOUT_SESSION_ID} with cs_test_... or cs_live_... on redirect.
    return defaultUrl;
}

function checkoutCancelUrl() {
    if (process.env.STRIPE_CANCEL_URL) {
        return process.env.STRIPE_CANCEL_URL;
    }
    return `${clientBaseUrl()}/checkout/cancel`;
}

/**
 * Load and validate cart lines from DB. Never uses client-supplied prices.
 * @param {{ product_id: string, quantity: number }[]} requestedItems
 */
async function resolveCheckoutLines(requestedItems) {
    const errors = [];
    const lines = [];

    for (let i = 0; i < requestedItems.length; i++) {
        const { product_id, quantity } = requestedItems[i];
        const prefix = `items[${i}]`;

        const product = await applyProductRelations(
            Product.findOne({
                _id: product_id,
                is_active: true,
                deleted_at: null
            })
        ).exec();

        if (!product) {
            errors.push(`${prefix}: product not found or not available`);
            continue;
        }

        if (product.quantity_available < quantity) {
            errors.push(
                `${prefix}: insufficient stock (requested ${quantity}, available ${product.quantity_available})`
            );
            continue;
        }

        const currency = (product.currency || 'usd').toLowerCase();
        if (lines.length && lines[0].currency !== currency) {
            errors.push(`${prefix}: all items must use the same currency`);
            continue;
        }

        const imageUrl = primaryProductImageUrl(product);
        let stripeImage;
        if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
            stripeImage = imageUrl;
        }

        lines.push({
            product,
            quantity,
            currency,
            unit_price_cents: product.price_cents,
            display_name: lineItemDisplayName(product),
            image_url: imageUrl,
            stripe_image: stripeImage,
            size_label: product.size_label || null
        });
    }

    if (errors.length) {
        return { errors };
    }
    if (!lines.length) {
        return { errors: ['No valid items to checkout'] };
    }

    return { lines };
}

/**
 * @param {object} body Request JSON body
 * @returns {Promise<{ ok: true, url: string, sessionId: string } | { ok: false, status: number, errors?: string[], error?: string }>}
 */
async function createCheckoutSession(body) {
    const parsed = parseCheckoutItemsBody(body);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const resolved = await resolveCheckoutLines(parsed.items);
    if (resolved.errors) {
        return { ok: false, status: 400, errors: resolved.errors };
    }

    const { lines } = resolved;
    const currency = lines[0].currency;

    const stripeLineItems = lines.map((line) => {
        const product = line.product;
        if (product.stripe_price_id) {
            return {
                quantity: line.quantity,
                price: product.stripe_price_id
            };
        }

        const item = {
            quantity: line.quantity,
            price_data: {
                currency,
                unit_amount: line.unit_price_cents,
                product_data: {
                    name: line.display_name,
                    metadata: {
                        product_id: String(product._id)
                    }
                }
            }
        };
        if (line.stripe_image) {
            item.price_data.product_data.images = [line.stripe_image];
        }
        if (line.size_label) {
            item.price_data.product_data.description = `Size: ${line.size_label}`;
        }
        return item;
    });

    const itemsMeta = lines.map((line) => ({
        product_id: String(line.product._id),
        quantity: line.quantity
    }));

    const stripe = getStripe();
    const successUrl = checkoutSuccessUrl();
    const cancelUrl = checkoutCancelUrl();
    if (process.env.NODE_ENV === 'development') {
        console.log('[checkout] success_url:', successUrl);
        console.log('[checkout] cancel_url:', cancelUrl);
        console.log('[checkout] CLIENT_URL:', clientBaseUrl());
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: stripeLineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            items_json: JSON.stringify(itemsMeta)
        },
        shipping_address_collection: {
            allowed_countries: ['US', 'CA']
        }
    });

    if (!session.url) {
        return { ok: false, status: 500, error: 'Stripe did not return a checkout URL' };
    }

    return {
        ok: true,
        url: session.url,
        sessionId: session.id
    };
}

module.exports = {
    createCheckoutSession,
    resolveCheckoutLines,
    clientBaseUrl
};
