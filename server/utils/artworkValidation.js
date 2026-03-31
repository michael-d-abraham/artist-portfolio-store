const mongoose = require('mongoose');

function isValidObjectId(id) {
    return mongoose.isValidObjectId(id);
}

/**
 * @param {object} body
 * @returns {{ errors: string[] } | null}
 */
function validateCreateBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    if (body.title == null || String(body.title).trim() === '') {
        errors.push('title is required');
    }
    if (body.description == null || String(body.description).trim() === '') {
        errors.push('description is required');
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
function validateUpdateBody(body) {
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    const errors = [];
    if (body.title !== undefined && String(body.title).trim() === '') {
        errors.push('title cannot be empty');
    }
    if (body.description !== undefined && String(body.description).trim() === '') {
        errors.push('description cannot be empty');
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    return errors.length ? { errors } : null;
}

module.exports = {
    isValidObjectId,
    validateCreateBody,
    validateUpdateBody
};
