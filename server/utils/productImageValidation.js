const { isValidObjectId } = require('./artworkValidation');

function validateProductImageCreateBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    if (body.product_id == null || !isValidObjectId(body.product_id)) {
        errors.push('product_id is required and must be a valid ObjectId');
    }
    if (body.image_url == null || String(body.image_url).trim() === '') {
        errors.push('image_url is required');
    }
    if (body.image_provider_id !== undefined && body.image_provider_id !== null && typeof body.image_provider_id !== 'string') {
        errors.push('image_provider_id must be a string');
    }
    if (body.alt_text !== undefined && body.alt_text !== null && typeof body.alt_text !== 'string') {
        errors.push('alt_text must be a string');
    }
    if (body.sort_order !== undefined) {
        if (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order)) {
            errors.push('sort_order must be an integer');
        }
    }
    if (body.is_primary !== undefined && typeof body.is_primary !== 'boolean') {
        errors.push('is_primary must be a boolean');
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    return errors.length ? { errors } : null;
}

function validateProductImageUpdateBody(body) {
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    const errors = [];
    if (body.image_url !== undefined && String(body.image_url).trim() === '') {
        errors.push('image_url cannot be empty');
    }
    if (body.image_provider_id !== undefined && body.image_provider_id !== null && typeof body.image_provider_id !== 'string') {
        errors.push('image_provider_id must be a string');
    }
    if (body.alt_text !== undefined && body.alt_text !== null && typeof body.alt_text !== 'string') {
        errors.push('alt_text must be a string');
    }
    if (body.sort_order !== undefined) {
        if (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order)) {
            errors.push('sort_order must be an integer');
        }
    }
    if (body.is_primary !== undefined && typeof body.is_primary !== 'boolean') {
        errors.push('is_primary must be a boolean');
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    return errors.length ? { errors } : null;
}

module.exports = {
    validateProductImageCreateBody,
    validateProductImageUpdateBody
};
