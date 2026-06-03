const { isValidObjectId } = require('./objectIdValidation');

/**
 * @param {unknown} body
 * @returns {{ errors: string[] } | { items: { product_id: string, quantity: number }[] }}
 */
function parseCheckoutItemsBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }

    const raw = body.items;
    if (!Array.isArray(raw) || raw.length === 0) {
        return { errors: ['items must be a non-empty array'] };
    }

    const items = [];
    raw.forEach((entry, i) => {
        const prefix = `items[${i}]`;
        if (entry == null || typeof entry !== 'object') {
            errors.push(`${prefix} must be an object`);
            return;
        }
        const productId = entry.product_id != null ? String(entry.product_id).trim() : '';
        if (!productId || !isValidObjectId(productId)) {
            errors.push(`${prefix}.product_id must be a valid ObjectId`);
            return;
        }
        const qty = entry.quantity;
        if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
            errors.push(`${prefix}.quantity must be a positive integer`);
            return;
        }
        items.push({ product_id: productId, quantity: qty });
    });

    if (errors.length) {
        return { errors };
    }
    return { items };
}

module.exports = {
    parseCheckoutItemsBody
};
