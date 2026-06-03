const request = require('supertest');
const { createApp } = require('../server/app');
const { Order, OrderItem } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase, getProductStock } = require('./helpers/mongo');
const {
    mockSessionsRetrieve,
    mockListLineItems,
    mockConstructEvent,
    resetStripeMocks
} = require('./helpers/stripeMock');
const {
    createTestProduct,
    buildPaidCheckoutSession,
    buildStripeLineItemsPage
} = require('./helpers/factories');
const { fulfillOrderFromStripeSession } = require('../server/services/fulfillOrderFromStripeSession');

const app = createApp();
const WEBHOOK_PATH = '/api/webhooks/stripe';
const SESSION_ID = 'cs_test_jestsession0000000000000001';

function postWebhook(body = { type: 'noop' }) {
    return request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 'sig_test_valid')
        .send(Buffer.from(JSON.stringify(body)));
}

function mockCompletedCheckoutEvent(productId, quantity = 1) {
    const session = buildPaidCheckoutSession(productId, {
        id: SESSION_ID,
        quantity
    });

    mockConstructEvent.mockReturnValue({
        id: 'evt_test_completed_1',
        type: 'checkout.session.completed',
        data: { object: { id: SESSION_ID } }
    });
    mockSessionsRetrieve.mockResolvedValue(session);
    mockListLineItems.mockResolvedValue(
        buildStripeLineItemsPage(productId, quantity, 2000)
    );

    return session;
}

describe('POST /api/webhooks/stripe', () => {
    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await clearDatabase();
        resetStripeMocks();
    });

    it('fulfills order on checkout.session.completed (paid)', async () => {
        const product = await createTestProduct({ quantity_available: 3, price_cents: 2000 });
        mockCompletedCheckoutEvent(product._id, 1);

        const res = await postWebhook();

        expect(res.status).toBe(200);
        expect(res.body.received).toBe(true);

        const orders = await Order.find().lean();
        expect(orders).toHaveLength(1);
        expect(orders[0].stripe_checkout_session_id).toBe(SESSION_ID);
        expect(orders[0].payment_status).toBe('paid');
        expect(orders[0].total_cents).toBe(2000);

        const items = await OrderItem.find().lean();
        expect(items).toHaveLength(1);
        expect(items[0].product_id.toString()).toBe(String(product._id));
        expect(items[0].quantity).toBe(1);
        expect(items[0].unit_price_cents).toBe(2000);

        expect(await getProductStock(product._id)).toBe(2);
    });

    it('is idempotent when the same checkout.session.completed is sent twice', async () => {
        const product = await createTestProduct({ quantity_available: 5 });
        mockCompletedCheckoutEvent(product._id, 2);

        await postWebhook();
        const res2 = await postWebhook();

        expect(res2.status).toBe(200);

        expect(await Order.countDocuments()).toBe(1);
        expect(await OrderItem.countDocuments()).toBe(1);
        expect(await getProductStock(product._id)).toBe(3);
    });

    it('rejects webhook with invalid signature', async () => {
        const product = await createTestProduct({ quantity_available: 5 });
        mockCompletedCheckoutEvent(product._id, 1);

        mockConstructEvent.mockImplementation(() => {
            throw new Error('Invalid signature');
        });

        const res = await postWebhook({
            type: 'checkout.session.completed',
            data: { object: { id: SESSION_ID } }
        });

        expect(res.status).toBe(400);
        expect(await Order.countDocuments()).toBe(0);
        expect(await getProductStock(product._id)).toBe(5);
    });

    it('does not create order when payment_status is not paid', async () => {
        const product = await createTestProduct({ quantity_available: 5 });
        const session = buildPaidCheckoutSession(product._id, {
            id: SESSION_ID,
            payment_status: 'unpaid'
        });

        mockConstructEvent.mockReturnValue({
            id: 'evt_test_unpaid',
            type: 'checkout.session.completed',
            data: { object: { id: SESSION_ID } }
        });
        mockSessionsRetrieve.mockResolvedValue(session);

        const res = await postWebhook();

        expect(res.status).toBe(200);
        expect(res.body.skipped).toBe('payment_not_paid');
        expect(await Order.countDocuments()).toBe(0);
        expect(await getProductStock(product._id)).toBe(5);
    });

    it('does not create order for non-checkout.session.completed events', async () => {
        const product = await createTestProduct({ quantity_available: 5 });

        mockConstructEvent.mockReturnValue({
            id: 'evt_test_other',
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_test_123' } }
        });

        const res = await postWebhook();

        expect(res.status).toBe(200);
        expect(res.body.received).toBe(true);
        expect(mockSessionsRetrieve).not.toHaveBeenCalled();
        expect(await Order.countDocuments()).toBe(0);
        expect(await getProductStock(product._id)).toBe(5);
    });
});

describe('fulfillOrderFromStripeSession (direct)', () => {
    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await clearDatabase();
        resetStripeMocks();
    });

    it('duplicate fulfillment returns duplicate flag without double decrement', async () => {
        const product = await createTestProduct({ quantity_available: 4 });
        const session = buildPaidCheckoutSession(product._id, { id: SESSION_ID });
        mockListLineItems.mockResolvedValue(buildStripeLineItemsPage(product._id, 1, 2000));

        const first = await fulfillOrderFromStripeSession(session);
        const second = await fulfillOrderFromStripeSession(session);

        expect(first.ok).toBe(true);
        expect(first.duplicate).toBeUndefined();
        expect(second.ok).toBe(true);
        expect(second.duplicate).toBe(true);
        expect(await Order.countDocuments()).toBe(1);
        expect(await getProductStock(product._id)).toBe(3);
    });
});
