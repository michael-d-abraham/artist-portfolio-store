const request = require('supertest');
const { createApp } = require('../server/app');
const { Order, OrderItem } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase } = require('./helpers/mongo');
const {
    mockSessionsRetrieve,
    mockListLineItems,
    resetStripeMocks
} = require('./helpers/stripeMock');
const { createTestProduct, buildPaidCheckoutSession, buildStripeLineItemsPage } = require('./helpers/factories');

const app = createApp();
const SESSION_ID = 'cs_test_jestsession0000000000000002';

describe('GET /api/orders/checkout-session/:sessionId', () => {
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

    it('reads Stripe session only and does not create orders (refresh-safe)', async () => {
        const product = await createTestProduct();
        const session = buildPaidCheckoutSession(product._id, { id: SESSION_ID });

        mockSessionsRetrieve.mockResolvedValue({
            ...session,
            line_items: { data: buildStripeLineItemsPage(product._id).data }
        });
        mockListLineItems.mockResolvedValue(buildStripeLineItemsPage(product._id));

        const url = `/api/orders/checkout-session/${SESSION_ID}`;

        const res1 = await request(app).get(url);
        const res2 = await request(app).get(url);

        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        expect(res1.body.session_id).toBe(SESSION_ID);
        expect(res1.body.payment_status).toBe('paid');
        expect(res1.body.items).toHaveLength(1);

        expect(await Order.countDocuments()).toBe(0);
        expect(await OrderItem.countDocuments()).toBe(0);
    });
});
