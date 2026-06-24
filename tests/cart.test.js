/**
 * @jest-environment jsdom
 */

const {
    addToCart,
    getCart,
    clearCart,
    getCheckoutItems,
    setCartQuantity,
    setBuyNowCart
} = require('../frontend/src/utils/cart');

describe('cart localStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('getCheckoutItems sends only product_id and quantity (no prices)', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439011',
            slug: 'test-print',
            title: 'Test',
            price_cents: 9999,
            quantity_available: 5
        });

        const payload = getCheckoutItems();
        expect(payload).toEqual([
            {
                product_id: '507f1f77bcf86cd799439011',
                quantity: 1
            }
        ]);
        expect(payload[0]).not.toHaveProperty('price_cents');
        expect(payload[0]).not.toHaveProperty('unit_price_cents');
    });

    it('clearCart empties the cart after successful purchase flow', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439012',
            slug: 'another',
            quantity_available: 2
        });
        expect(getCart()).toHaveLength(1);

        clearCart();
        expect(getCart()).toEqual([]);
    });

    it('setCartQuantity clamps below min and above max', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439013',
            slug: 'clamp-test',
            quantity_available: 200
        });

        setCartQuantity('507f1f77bcf86cd799439013', 0);
        expect(getCart()[0].quantity).toBe(1);

        setCartQuantity('507f1f77bcf86cd799439013', 150);
        expect(getCart()[0].quantity).toBe(99);
    });

    it('setBuyNowCart clamps quantity to max', () => {
        setBuyNowCart(
            {
                _id: '507f1f77bcf86cd799439014',
                slug: 'buy-now',
                quantity_available: 200
            },
            150
        );

        expect(getCart()).toEqual([
            {
                productId: '507f1f77bcf86cd799439014',
                slug: 'buy-now',
                quantity: 99
            }
        ]);
    });
});
