const Stripe = require('stripe');

let stripe;

function assertStripeSecretKey(key) {
    if (!key || !String(key).trim()) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    const trimmed = String(key).trim();
    if (trimmed.startsWith('pk_')) {
        throw new Error(
            'STRIPE_SECRET_KEY is set to a publishable key (pk_...). Use your secret key (sk_test_... or sk_live_...) from https://dashboard.stripe.com/test/apikeys'
        );
    }
    if (!trimmed.startsWith('sk_')) {
        throw new Error('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_');
    }
    return trimmed;
}

function getStripe() {
    if (!stripe) {
        const key = assertStripeSecretKey(process.env.STRIPE_SECRET_KEY);
        stripe = new Stripe(key);
    }
    return stripe;
}

module.exports = {
    getStripe
};
