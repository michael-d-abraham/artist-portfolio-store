const crypto = require('crypto');
const { Product } = require('../../server/db');

async function createTestProduct(overrides = {}) {
    const suffix = crypto.randomBytes(4).toString('hex');
    return Product.create({
        title: 'Test Print',
        slug: `test-print-${suffix}`,
        description: 'Test description',
        price_cents: 2000,
        currency: 'usd',
        quantity_available: 5,
        size_label: '12" × 16"',
        format: 'Giclée',
        is_active: true,
        deleted_at: null,
        ...overrides
    });
}

function checkoutPayload(productId, quantity = 1, extraItemFields = {}) {
    return {
        items: [
            {
                product_id: String(productId),
                quantity,
                ...extraItemFields
            }
        ]
    };
}

function buildPaidCheckoutSession(productId, overrides = {}) {
    const sessionId = overrides.id || 'cs_test_jestsession0000000000000001';
    const qty = overrides.quantity ?? 1;
    const unitAmount = overrides.unit_amount ?? 2000;
    const total = unitAmount * qty;

    return {
        id: sessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        currency: 'usd',
        amount_subtotal: total,
        amount_total: total,
        total_details: { amount_tax: 0, amount_shipping: 0 },
        customer_details: {
            email: 'buyer@example.com',
            name: 'Test Buyer'
        },
        payment_intent: 'pi_test_jestpayment00001',
        metadata: {
            items_json: JSON.stringify([{ product_id: String(productId), quantity: qty }])
        },
        ...overrides
    };
}

function buildStripeLineItemsPage(productId, quantity = 1, unitAmount = 2000) {
    return {
        data: [
            {
                id: 'li_test_1',
                quantity,
                amount_subtotal: unitAmount * quantity,
                price: {
                    unit_amount: unitAmount,
                    product: {
                        metadata: { product_id: String(productId) }
                    }
                }
            }
        ],
        has_more: false
    };
}

module.exports = {
    createTestProduct,
    checkoutPayload,
    buildPaidCheckoutSession,
    buildStripeLineItemsPage
};
