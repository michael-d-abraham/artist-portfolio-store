const { isValidObjectId } = require('./artworkValidation');

function isNonEmptyString(value) {
    return value != null && String(value).trim() !== '';
}

function validatePriceCents(value, label, errors) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        errors.push(`${label} must be a non-negative integer (cents)`);
    }
}

function validateNonNegativeInt(value, label, errors) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        errors.push(`${label} must be a non-negative integer`);
    }
}

function validateOptionalNumber(value, label, allowNull, errors) {
    if (value === undefined) {
        return;
    }
    if (allowNull && (value === null || value === '')) {
        return;
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${label} must be a number`);
    }
}

function validateOptionalStringOrNull(value, label, errors) {
    if (value === undefined) {
        return;
    }
    if (value !== null && typeof value !== 'string') {
        errors.push(`${label} must be a string or null`);
    }
}

function validateVariantSizeFields(body, errors) {
    validateOptionalStringOrNull(body.size_label, 'size_label', errors);
    validateOptionalNumber(body.width, 'width', true, errors);
    validateOptionalNumber(body.height, 'height', true, errors);
    validateOptionalNumber(body.depth, 'depth', true, errors);
    validateOptionalStringOrNull(body.dimension_unit, 'dimension_unit', errors);
}

/**
 * PATCH quantities (and optional is_active) on Product — same rules as former inventory PATCH.
 * @param {object} body
 * @returns {{ errors: string[] } | null}
 */
function validateProductQuantityPatchBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    if (body.quantity_total !== undefined) {
        validateNonNegativeInt(body.quantity_total, 'quantity_total', errors);
    }
    if (body.quantity_available !== undefined) {
        validateNonNegativeInt(body.quantity_available, 'quantity_available', errors);
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    return errors.length ? { errors } : null;
}

/**
 * @param {object} body
 * @returns {{ errors: string[] } | null}
 */
function validateProductCreateBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    if (!isNonEmptyString(body.artwork_id) || !isValidObjectId(body.artwork_id)) {
        errors.push('artwork_id is required and must be a valid ObjectId');
    }
    if (!isNonEmptyString(body.product_type_id) || !isValidObjectId(body.product_type_id)) {
        errors.push('product_type_id is required and must be a valid ObjectId');
    }
    if (body.price_cents === undefined || body.price_cents === null) {
        errors.push('price_cents is required');
    } else {
        validatePriceCents(body.price_cents, 'price_cents', errors);
    }
    if (body.quantity_total !== undefined) {
        validateNonNegativeInt(body.quantity_total, 'quantity_total', errors);
    }
    if (body.quantity_available !== undefined) {
        validateNonNegativeInt(body.quantity_available, 'quantity_available', errors);
    }
    validateVariantSizeFields(body, errors);
    if (body.is_active !== undefined && body.is_active !== null && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    return errors.length ? { errors } : null;
}

/**
 * @param {object} body
 * @returns {{ errors: string[] } | null}
 */
function validateProductUpdateBody(body) {
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    const errors = [];
    if (body.artwork_id !== undefined) {
        if (!isNonEmptyString(body.artwork_id) || !isValidObjectId(body.artwork_id)) {
            errors.push('artwork_id must be a valid ObjectId');
        }
    }
    if (body.product_type_id !== undefined) {
        if (!isNonEmptyString(body.product_type_id) || !isValidObjectId(body.product_type_id)) {
            errors.push('product_type_id must be a valid ObjectId');
        }
    }
    if (body.price_cents !== undefined) {
        validatePriceCents(body.price_cents, 'price_cents', errors);
    }
    if (body.quantity_total !== undefined) {
        validateNonNegativeInt(body.quantity_total, 'quantity_total', errors);
    }
    if (body.quantity_available !== undefined) {
        validateNonNegativeInt(body.quantity_available, 'quantity_available', errors);
    }
    validateVariantSizeFields(body, errors);
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    return errors.length ? { errors } : null;
}

module.exports = {
    validateProductCreateBody,
    validateProductUpdateBody,
    validateProductQuantityPatchBody
};
