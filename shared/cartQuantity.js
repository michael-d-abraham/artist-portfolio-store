const CART_QUANTITY_MIN = 1;
const CART_QUANTITY_MAX = 99;

function clampCartQuantity(value) {
    return Math.max(CART_QUANTITY_MIN, Math.min(CART_QUANTITY_MAX, Number(value) || 1));
}

module.exports = { CART_QUANTITY_MIN, CART_QUANTITY_MAX, clampCartQuantity };
