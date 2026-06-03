const { getCheckoutSessionSummary } = require('../services/checkoutSessionSummaryService');
const { isValidCheckoutSessionId } = require('../utils/stripeSessionId');

const getCheckoutSessionSummaryHandler = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        if (!isValidCheckoutSessionId(sessionId)) {
            return res.status(400).json({ error: 'Invalid checkout session id' });
        }
        const result = await getCheckoutSessionSummary(sessionId);
        if (!result.ok) {
            return res.status(result.status || 400).json({ error: result.error || 'Unable to load order' });
        }
        return res.json(result.summary);
    } catch (err) {
        console.error('getCheckoutSessionSummary', err);
        const msg = err && err.message ? String(err.message) : '';
        if (msg.includes('STRIPE_SECRET_KEY') || msg.includes('publishable key')) {
            return res.status(503).json({ error: 'Order lookup is not configured' });
        }
        return res.status(500).json({ error: 'Unable to load order' });
    }
};

module.exports = {
    getCheckoutSessionSummaryHandler
};
