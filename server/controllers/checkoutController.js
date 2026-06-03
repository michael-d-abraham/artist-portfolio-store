const { createCheckoutSession } = require('../services/checkoutService');

const createCheckoutSessionHandler = async (req, res) => {
    try {
        const result = await createCheckoutSession(req.body);
        if (!result.ok) {
            if (result.errors) {
                return res.status(result.status || 400).json({ errors: result.errors });
            }
            return res.status(result.status || 500).json({ error: result.error || 'Checkout failed' });
        }
        return res.json({
            url: result.url,
            sessionId: result.sessionId
        });
    } catch (err) {
        console.error('createCheckoutSession', err);
        const msg = err && err.message ? String(err.message) : 'Checkout failed';
        if (msg.includes('STRIPE_SECRET_KEY') || msg.includes('publishable key')) {
            return res.status(503).json({
                error:
                    msg.includes('pk_') || msg.includes('publishable')
                        ? msg
                        : 'Payment is not configured. Set STRIPE_SECRET_KEY to your sk_test_... key in .env'
            });
        }
        if (err && err.code === 'secret_key_required') {
            return res.status(503).json({
                error:
                    'STRIPE_SECRET_KEY must be your secret key (sk_test_...), not the publishable key (pk_...). See Stripe Dashboard → Developers → API keys.'
            });
        }
        return res.status(500).json({ error: 'Checkout failed' });
    }
};

module.exports = {
    createCheckoutSessionHandler
};
