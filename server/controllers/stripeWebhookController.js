const { getStripe } = require('../utils/stripeClient');
const { fulfillOrderFromStripeSession } = require('../services/fulfillOrderFromStripeSession');

const stripeWebhookHandler = async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured');
        return res.status(503).send('Webhook not configured');
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
        return res.status(400).send('Missing Stripe-Signature header');
    }

    let event;
    try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, signature, secret);
    } catch (err) {
        console.error('Stripe webhook signature verification failed', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const stripe = getStripe();
            const session = await stripe.checkout.sessions.retrieve(event.data.object.id);

            if (session.payment_status !== 'paid') {
                return res.json({ received: true, skipped: 'payment_not_paid' });
            }

            const result = await fulfillOrderFromStripeSession(session);
            if (!result.ok) {
                console.error('Order fulfillment failed', result.error, session.id);
                return res.status(500).json({ error: result.error });
            }
            if (result.duplicate) {
                console.log('Stripe webhook duplicate (idempotent)', session.id, result.orderId);
            }
        }
        return res.json({ received: true });
    } catch (err) {
        console.error('stripeWebhookHandler', err);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }
};

module.exports = {
    stripeWebhookHandler
};
