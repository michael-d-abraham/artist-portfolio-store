// Mock the LangGraph pipeline so Jest never tries to parse @langchain/langgraph's
// ESM-only uuid dependency. None of these tests exercise the generation pipeline.
jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../server/app');
const { Order, OrderItem } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase, getProductStock } = require('./helpers/mongo');
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

    it('returns the paid session summary without mutating server state', async () => {
        const product = await createTestProduct({ quantity_available: 3, price_cents: 2000 });
        const session = buildPaidCheckoutSession(product._id, { id: SESSION_ID });

        mockSessionsRetrieve.mockResolvedValue({
            ...session,
            line_items: { data: buildStripeLineItemsPage(product._id).data }
        });
        mockListLineItems.mockResolvedValue(buildStripeLineItemsPage(product._id));

        const url = `/api/orders/checkout-session/${SESSION_ID}`;
        const res = await request(app).get(url);

        expect(res.status).toBe(200);
        expect(res.body.session_id).toBe(SESSION_ID);
        expect(res.body.payment_status).toBe('paid');

        // The public GET is read-only: fulfillment happens in the Stripe webhook.
        expect(await Order.countDocuments()).toBe(0);
        expect(await OrderItem.countDocuments()).toBe(0);
        expect(await getProductStock(product._id)).toBe(3);
    });

    it('never decrements stock no matter how many times the success page is refreshed', async () => {
        const product = await createTestProduct({ quantity_available: 5 });
        const session = buildPaidCheckoutSession(product._id, { id: SESSION_ID, quantity: 2 });

        mockSessionsRetrieve.mockResolvedValue({
            ...session,
            line_items: { data: buildStripeLineItemsPage(product._id, 2).data }
        });
        mockListLineItems.mockResolvedValue(buildStripeLineItemsPage(product._id, 2));

        const url = `/api/orders/checkout-session/${SESSION_ID}`;

        await request(app).get(url);
        await request(app).get(url);

        expect(await Order.countDocuments()).toBe(0);
        expect(await OrderItem.countDocuments()).toBe(0);
        expect(await getProductStock(product._id)).toBe(5);
    });
});
