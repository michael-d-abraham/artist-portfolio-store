const { getStripe } = require('../utils/stripeClient');
const { normalizeCheckoutSessionId } = require('../utils/stripeSessionId');
const { sendPaidTransactionNotification } = require('./orderNotificationEmailService');

function formatAddress(address) {
    if (!address || typeof address !== 'object') {
        return null;
    }
    const line1 = address.line1 || '';
    const line2 = address.line2 || '';
    const city = address.city || '';
    const state = address.state || '';
    const postal_code = address.postal_code || '';
    const country = address.country || '';
    if (!line1 && !city && !postal_code && !country) {
        return null;
    }
    return { line1, line2, city, state, postal_code, country };
}

function lineItemName(item) {
    if (item.description) {
        return String(item.description);
    }
    const product = item.price && item.price.product;
    if (product && typeof product === 'object' && product.name) {
        return String(product.name);
    }
    return 'Item';
}

function mapLineItems(lineItemsData) {
    if (!Array.isArray(lineItemsData)) {
        return [];
    }
    return lineItemsData.map((item) => {
        const quantity = item.quantity || 1;
        const unitAmount = item.price && typeof item.price.unit_amount === 'number' ? item.price.unit_amount : 0;
        const lineTotal =
            typeof item.amount_subtotal === 'number'
                ? item.amount_subtotal
                : unitAmount * quantity;
        return {
            name: lineItemName(item),
            quantity,
            unit_amount_cents: unitAmount,
            line_total_cents: lineTotal
        };
    });
}

function mapSessionSummary(session, lineItemsData) {
    const customerDetails = session.customer_details || {};
    const collected = session.collected_information || {};
    const shippingDetails =
        session.shipping_details ||
        collected.shipping_details ||
        customerDetails.shipping ||
        null;
    const shippingAddress =
        (shippingDetails && formatAddress(shippingDetails.address)) ||
        formatAddress(customerDetails.address);
    const billingAddress = formatAddress(customerDetails.address);

    const totalDetails = session.total_details || {};
    const customerName =
        (shippingDetails && shippingDetails.name) ||
        customerDetails.name ||
        null;
    const customerEmail = customerDetails.email || null;

    return {
        session_id: session.id,
        payment_status: session.payment_status || null,
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        amount_subtotal_cents: session.amount_subtotal ?? null,
        amount_tax_cents: totalDetails.amount_tax ?? null,
        amount_shipping_cents: totalDetails.amount_shipping ?? null,
        amount_total_cents: session.amount_total ?? null,
        currency: (session.currency || 'usd').toLowerCase(),
        items: mapLineItems(lineItemsData)
    };
}

/**
 * @param {string} sessionId
 * @returns {Promise<{ ok: true, summary: object } | { ok: false, status: number, error: string }>}
 */
async function getCheckoutSessionSummary(sessionId) {
    const id = normalizeCheckoutSessionId(sessionId);
    if (!id) {
        return { ok: false, status: 400, error: 'Invalid checkout session id' };
    }

    const stripe = getStripe();
    let session;
    try {
        session = await stripe.checkout.sessions.retrieve(id, {
            expand: ['line_items.data.price.product']
        });
    } catch (err) {
        if (err && err.statusCode === 404) {
            return { ok: false, status: 404, error: 'Order not found' };
        }
        throw err;
    }

    if (session.payment_status !== 'paid') {
        return {
            ok: false,
            status: 402,
            error: 'Payment has not been completed for this session'
        };
    }

    let lineItemsData = session.line_items && session.line_items.data;
    if (!lineItemsData || !lineItemsData.length) {
        const listed = await stripe.checkout.sessions.listLineItems(id, {
            limit: 100,
            expand: ['data.price.product']
        });
        lineItemsData = listed.data;
    }

    sendPaidTransactionNotification(id).catch(() => {});

    return {
        ok: true,
        summary: mapSessionSummary(session, lineItemsData)
    };
}

module.exports = {
    getCheckoutSessionSummary,
    formatAddress,
    mapSessionSummary
};
