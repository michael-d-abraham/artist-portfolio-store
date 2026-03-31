function validateFeatures(value, errors) {
    if (value === undefined) {
        return;
    }
    if (!Array.isArray(value)) {
        errors.push('features must be an array of strings');
        return;
    }
    const allStrings = value.every((item) => typeof item === 'string');
    if (!allStrings) {
        errors.push('features must be an array of strings');
    }
}

function validateProductTypeCreateBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }

    if (body.name == null || String(body.name).trim() === '') {
        errors.push('name is required');
    }
    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
        errors.push('description must be a string');
    }
    if (body.material !== undefined && body.material !== null && typeof body.material !== 'string') {
        errors.push('material must be a string');
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    validateFeatures(body.features, errors);

    return errors.length ? { errors } : null;
}

function validateProductTypeUpdateBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }

    if (body.name !== undefined && String(body.name).trim() === '') {
        errors.push('name cannot be empty');
    }
    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
        errors.push('description must be a string');
    }
    if (body.material !== undefined && body.material !== null && typeof body.material !== 'string') {
        errors.push('material must be a string');
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    validateFeatures(body.features, errors);

    return errors.length ? { errors } : null;
}

module.exports = {
    validateProductTypeCreateBody,
    validateProductTypeUpdateBody
};
