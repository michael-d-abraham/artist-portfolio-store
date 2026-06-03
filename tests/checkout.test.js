const request = require('supertest');
const { createApp } = require('../server/app');
const { Order, OrderItem } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase, getProductStock } = require('./helpers/mongo');
const {
    mockSessionsCreate,
    resetStripeMocks,
    defaultSuccessfulSessionCreate
} = require('./helpers/stripeMock');
const { createTestProduct, checkoutPayload } = require('./helpers/factories');

const app = createApp();

async function orderCount() {
    return Order.countDocuments();
}

async function orderItemCount() {
    return OrderItem.countDocuments();
}

describe('POST /api/create-checkout-session', () => {
    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await clearDatabase();
        resetStripeMocks();
        defaultSuccessfulSessionCreate();
    });

    it('rejects out-of-stock product (quantity_available = 0)', async () => {
        const product = await createTestProduct({ quantity_available: 0 });

        const res = await request(app)
            .post('/api/create-checkout-session')
            .send(checkoutPayload(product._id, 1));

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/insufficient stock/i)
            ])
        );
        expect(mockSessionsCreate).not.toHaveBeenCalled();
        expect(await orderCount()).toBe(0);
        expect(await getProductStock(product._id)).toBe(0);
    });

    it('rejects quantity greater than stock', async () => {
        const product = await createTestProduct({ quantity_available: 2 });

        const res = await request(app)
            .post('/api/create-checkout-session')
            .send(checkoutPayload(product._id, 3));

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/insufficient stock/i)
            ])
        );
        expect(mockSessionsCreate).not.toHaveBeenCalled();
        expect(await orderCount()).toBe(0);
        expect(await getProductStock(product._id)).toBe(2);
    });

    it('rejects inactive product', async () => {
        const product = await createTestProduct({ is_active: false });

        const res = await request(app)
            .post('/api/create-checkout-session')
            .send(checkoutPayload(product._id, 1));

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.stringMatching(/not found or not available/i)])
        );
        expect(mockSessionsCreate).not.toHaveBeenCalled();
        expect(await orderCount()).toBe(0);
    });

    it('rejects soft-deleted product', async () => {
        const product = await createTestProduct({ deleted_at: new Date() });

        const res = await request(app)
            .post('/api/create-checkout-session')
            .send(checkoutPayload(product._id, 1));

        expect(res.status).toBe(400);
        expect(mockSessionsCreate).not.toHaveBeenCalled();
        expect(await orderCount()).toBe(0);
    });

    it('rejects invalid product id', async () => {
        const res = await request(app)
            .post('/api/create-checkout-session')
            .send({ items: [{ product_id: 'not-an-object-id', quantity: 1 }] });

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.stringMatching(/valid ObjectId/i)])
        );
        expect(mockSessionsCreate).not.toHaveBeenCalled();
    });

    it('rejects missing product id', async () => {
        const res = await request(app)
            .post('/api/create-checkout-session')
            .send({ items: [{ quantity: 1 }] });

        expect(res.status).toBe(400);
        expect(mockSessionsCreate).not.toHaveBeenCalled();
    });

    it('ignores frontend price tampering and uses database price_cents', async () => {
        const product = await createTestProduct({ price_cents: 2500, title: 'Tamper Test' });

        const res = await request(app)
            .post('/api/create-checkout-session')
            .send(
                checkoutPayload(product._id, 1, {
                    price_cents: 1,
                    unit_price_cents: 1,
                    price: 0.01
                })
            );

        expect(res.status).toBe(200);
        expect(mockSessionsCreate).toHaveBeenCalledTimes(1);

        const stripeParams = mockSessionsCreate.mock.calls[0][0];
        const line = stripeParams.line_items[0];
        expect(line.price_data.unit_amount).toBe(2500);
        expect(line.price_data.product_data.name).toContain('Tamper Test');
        expect(line.quantity).toBe(1);
        expect(await orderCount()).toBe(0);
    });

    it('creates Stripe session with DB title, price, quantity, and redirect URLs', async () => {
        const product = await createTestProduct({
            price_cents: 3200,
            title: 'Horizon Line',
            quantity_available: 4
        });

        const res = await request(app)
            .post('/api/create-checkout-session')
            .send(checkoutPayload(product._id, 2));

        expect(res.status).toBe(200);
        expect(res.body.url).toBe('https://checkout.stripe.com/test-session');
        expect(res.body.sessionId).toMatch(/^cs_test_/);

        expect(mockSessionsCreate).toHaveBeenCalledTimes(1);
        const stripeParams = mockSessionsCreate.mock.calls[0][0];

        expect(stripeParams.mode).toBe('payment');
        expect(stripeParams.line_items).toHaveLength(1);
        expect(stripeParams.line_items[0].quantity).toBe(2);
        expect(stripeParams.line_items[0].price_data.unit_amount).toBe(3200);
        expect(stripeParams.line_items[0].price_data.product_data.name).toMatch(/Horizon Line/);
        expect(stripeParams.success_url).toBe(
            'http://localhost:5174/order-success?session_id={CHECKOUT_SESSION_ID}'
        );
        expect(stripeParams.cancel_url).toBe('http://localhost:5174/checkout/cancel');

        expect(await orderCount()).toBe(0);
        expect(await orderItemCount()).toBe(0);
        expect(await getProductStock(product._id)).toBe(4);
    });
});
