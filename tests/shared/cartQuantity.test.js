const {
    CART_QUANTITY_MIN,
    CART_QUANTITY_MAX,
    clampCartQuantity
} = require('../../shared/cartQuantity');

describe('shared/cartQuantity', () => {
    it('exports expected bounds', () => {
        expect(CART_QUANTITY_MIN).toBe(1);
        expect(CART_QUANTITY_MAX).toBe(99);
    });

    it('clampCartQuantity enforces min and max', () => {
        expect(clampCartQuantity(0)).toBe(1);
        expect(clampCartQuantity(-5)).toBe(1);
        expect(clampCartQuantity(1)).toBe(1);
        expect(clampCartQuantity(99)).toBe(99);
        expect(clampCartQuantity(100)).toBe(99);
        expect(clampCartQuantity(999)).toBe(99);
    });

    it('clampCartQuantity treats NaN as 1', () => {
        expect(clampCartQuantity(NaN)).toBe(1);
        expect(clampCartQuantity('')).toBe(1);
    });
});
