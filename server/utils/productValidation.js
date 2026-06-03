const { isValidObjectId } = require('./objectIdValidation');

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

function validateOptionalStringOrNull(value, label, errors) {
    if (value === undefined) {
        return;
    }
    if (value !== null && typeof value !== 'string') {
        errors.push(`${label} must be a string or null`);
    }
}

function validateCurrency(value, errors) {
    if (value === undefined) {
        return;
    }
    if (typeof value !== 'string' || !/^[a-z]{3}$/i.test(value.trim())) {
        errors.push('currency must be a 3-letter ISO code (e.g. usd)');
    }
}

function validateYearCreated(value, errors) {
    if (value === undefined) {
        return;
    }
    if (value !== null && (typeof value !== 'number' || !Number.isInteger(value))) {
        errors.push('year_created must be an integer or null');
    }
}

function validateProductImagesArray(images, errors) {
    if (!Array.isArray(images)) {
        errors.push('images must be an array');
        return;
    }
    images.forEach((img, i) => {
        if (img == null || typeof img !== 'object') {
            errors.push(`images[${i}] must be an object`);
            return;
        }
        if (!isNonEmptyString(img.image_url)) {
            errors.push(`images[${i}].image_url is required`);
        }
        if (img.is_primary !== undefined && typeof img.is_primary !== 'boolean') {
            errors.push(`images[${i}].is_primary must be a boolean`);
        }
    });
}

function validateCommonProductFields(body, errors, isCreate) {
    if (isCreate) {
        if (!isNonEmptyString(body.title)) {
            errors.push('title is required');
        }
        if (body.description == null || String(body.description).trim() === '') {
            errors.push('description is required');
        }
        if (body.price_cents === undefined || body.price_cents === null) {
            errors.push('price_cents is required');
        }
    } else {
        if (body.title !== undefined && !isNonEmptyString(body.title)) {
            errors.push('title cannot be empty');
        }
        if (body.description !== undefined && String(body.description).trim() === '') {
            errors.push('description cannot be empty');
        }
    }
    if (body.price_cents !== undefined && body.price_cents !== null) {
        validatePriceCents(body.price_cents, 'price_cents', errors);
    }
    if (body.quantity_available !== undefined) {
        validateNonNegativeInt(body.quantity_available, 'quantity_available', errors);
    }
    validateOptionalStringOrNull(body.size_label, 'size_label', errors);
    validateOptionalStringOrNull(body.format, 'format', errors);
    validateOptionalStringOrNull(body.stripe_product_id, 'stripe_product_id', errors);
    validateOptionalStringOrNull(body.stripe_price_id, 'stripe_price_id', errors);
    validateCurrency(body.currency, errors);
    validateYearCreated(body.year_created, errors);
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    if (body.slug !== undefined && !isNonEmptyString(body.slug)) {
        errors.push('slug cannot be empty');
    }
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
    validateCommonProductFields(body, errors, true);
    if (body.images !== undefined) {
        validateProductImagesArray(body.images, errors);
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
    validateCommonProductFields(body, errors, false);
    if (body.images !== undefined) {
        validateProductImagesArray(body.images, errors);
    }
    return errors.length ? { errors } : null;
}

module.exports = {
    validateProductCreateBody,
    validateProductUpdateBody
};
