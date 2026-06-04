process.env.NODE_ENV = 'test';
process.env.SKIP_DB_AUTO_CONNECT = '1';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_jest';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
process.env.CLIENT_URL = 'http://localhost:5174';
process.env.SESSION_SECRET = 'test-session-secret';

jest.mock('../server/utils/stripeClient', () => {
    const { createMockStripeClient } = require('./helpers/stripeMock');
    return {
        getStripe: jest.fn(() => createMockStripeClient())
    };
});
