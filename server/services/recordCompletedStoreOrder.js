const { getStripe } = require('../utils/stripeClient');
const { normalizeCheckoutSessionId } = require('../utils/stripeSessionId');
const { fulfillOrderFromStripeSession } = require('./fulfillOrderFromStripeSession');

/**
 * Load a paid Checkout Session from Stripe and persist internal order + line items.
 * Idempotent on stripe_checkout_session_id. Never throws.
 * @param {string} sessionId
 * @returns {Promise<{ ok: true, orderId: string, duplicate?: boolean } | { ok: false, error: string }>}
 */
async function recordCompletedStoreOrder(sessionId) {
    const id = normalizeCheckoutSessionId(sessionId);
    if (!id) {
        return { ok: false, error: 'Invalid checkout session id' };
    }

    try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(id, {
            expand: ['line_items.data.price.product']
        });

        if (session.payment_status !== 'paid') {
            return { ok: false, error: 'Payment has not been completed for this session' };
        }

        return await fulfillOrderFromStripeSession(session);
    } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Failed to record order';
        return { ok: false, error: msg };
    }
}

module.exports = { recordCompletedStoreOrder };
