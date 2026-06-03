/** Stripe Checkout Session IDs: cs_test_... or cs_live_... (underscores after prefix) */
const CHECKOUT_SESSION_ID_RE = /^cs_(?:test|live)_[a-zA-Z0-9]+$/;

function isValidCheckoutSessionId(sessionId) {
    return typeof sessionId === 'string' && CHECKOUT_SESSION_ID_RE.test(sessionId.trim());
}

function normalizeCheckoutSessionId(sessionId) {
    if (!isValidCheckoutSessionId(sessionId)) {
        return null;
    }
    return sessionId.trim();
}

module.exports = {
    isValidCheckoutSessionId,
    normalizeCheckoutSessionId
};
