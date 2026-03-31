const { isValidObjectId, validateCreateBody } = require('./artworkValidation');
const { validateProductTypeCreateBody } = require('./productTypeValidation');

function validatePriceCents(value, label, errors) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        errors.push(`${label} must be a non-negative integer (cents)`);
    }
}

function validateQuantityInt(value, label, errors) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        errors.push(`${label} must be a non-negative integer`);
    }
}

/** True if inline size has at least one numeric dimension, non-empty label, or size_code (legacy key ignored on Product). */
function sizeObjectDifferentiates(size) {
    if (!size || typeof size !== 'object') {
        return false;
    }
    const w = size.width;
    const h = size.height;
    const d = size.depth;
    const hasDim =
        (w !== undefined && w !== null && w !== '' && !Number.isNaN(Number(w))) ||
        (h !== undefined && h !== null && h !== '' && !Number.isNaN(Number(h))) ||
        (d !== undefined && d !== null && d !== '' && !Number.isNaN(Number(d)));
    const fl = size.format_label != null && String(size.format_label).trim() !== '';
    const sc = size.size_code != null && String(size.size_code).trim() !== '';
    return hasDim || fl || sc;
}

function variantFingerprint(entry) {
    if (entry == null || typeof entry !== 'object') {
        return '';
    }
    const sz = entry.size;
    if (!sz || typeof sz !== 'object' || !sizeObjectDifferentiates(sz)) {
        return JSON.stringify({ bare: true });
    }
    const norm = {
        w: sz.width !== undefined && sz.width !== '' && !Number.isNaN(Number(sz.width)) ? Number(sz.width) : null,
        h: sz.height !== undefined && sz.height !== '' && !Number.isNaN(Number(sz.height)) ? Number(sz.height) : null,
        d: sz.depth !== undefined && sz.depth !== '' && !Number.isNaN(Number(sz.depth)) ? Number(sz.depth) : null,
        u: sz.dimension_unit != null ? String(sz.dimension_unit).trim() : '',
        l: sz.format_label != null ? String(sz.format_label).trim() : '',
        c: sz.size_code != null ? String(sz.size_code).trim() : ''
    };
    return JSON.stringify(norm);
}

function entryHasProductDifferentiator(entry) {
    if (entry == null || typeof entry !== 'object') {
        return false;
    }
    return sizeObjectDifferentiates(entry.size);
}

/**
 * @param {object} body
 * @returns {{ errors: string[] } | null}
 */
function validateCatalogItemBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }

    const hasArtworkId = body.artwork_id != null && String(body.artwork_id).trim() !== '';
    const hasArtwork = body.artwork != null && typeof body.artwork === 'object';
    if (!hasArtworkId && !hasArtwork) {
        errors.push('artwork_id or artwork is required');
    }
    if (hasArtworkId) {
        if (!isValidObjectId(body.artwork_id)) {
            errors.push('artwork_id must be a valid ObjectId');
        }
        if (hasArtwork) {
            errors.push('Provide only one of artwork_id or artwork');
        }
    }
    if (hasArtwork && !hasArtworkId) {
        const aErr = validateCreateBody(body.artwork);
        if (aErr) {
            errors.push(...aErr.errors.map((e) => `artwork: ${e}`));
        }
    }

    const hasTypeId = body.product_type_id != null && String(body.product_type_id).trim() !== '';
    const hasType = body.product_type != null && typeof body.product_type === 'object';
    if (!hasTypeId && !hasType) {
        errors.push('product_type_id or product_type is required');
    }
    if (hasTypeId) {
        if (!isValidObjectId(body.product_type_id)) {
            errors.push('product_type_id must be a valid ObjectId');
        }
        if (hasType) {
            errors.push('Provide only one of product_type_id or product_type');
        }
    }
    if (hasType && !hasTypeId) {
        const tErr = validateProductTypeCreateBody(body.product_type);
        if (tErr) {
            errors.push(...tErr.errors.map((e) => `product_type: ${e}`));
        }
    }

    const products = Array.isArray(body.products) ? body.products : body.sizes;
    if (!Array.isArray(products) || products.length === 0) {
        errors.push('products must be a non-empty array');
    }

    if (Array.isArray(products)) {
        products.forEach((entry, i) => {
            const prefix = `products[${i}]`;
            if (entry == null || typeof entry !== 'object') {
                errors.push(`${prefix} must be an object`);
                return;
            }
            const hasSid = entry.product_size_id != null && String(entry.product_size_id).trim() !== '';
            if (hasSid) {
                errors.push(
                    `${prefix}: product_size_id is no longer supported; send size with format_label and/or dimensions instead`
                );
            }

            if (entry.price_cents === undefined || entry.price_cents === null) {
                errors.push(`${prefix}: price_cents is required`);
            } else {
                validatePriceCents(entry.price_cents, `${prefix}.price_cents`, errors);
            }

            if (entry.quantity !== undefined && entry.quantity !== null) {
                validateQuantityInt(entry.quantity, `${prefix}.quantity`, errors);
            }

            if (entry.is_active !== undefined && typeof entry.is_active !== 'boolean') {
                errors.push(`${prefix}: is_active must be a boolean`);
            }

            if (entry.inventory != null && typeof entry.inventory !== 'object') {
                errors.push(`${prefix}: inventory must be an object`);
            }
            if (entry.inventory != null && typeof entry.inventory === 'object') {
                if (entry.inventory.quantity_total !== undefined) {
                    validateQuantityInt(
                        entry.inventory.quantity_total,
                        `${prefix}.inventory.quantity_total`,
                        errors
                    );
                }
                if (entry.inventory.quantity_available !== undefined) {
                    validateQuantityInt(
                        entry.inventory.quantity_available,
                        `${prefix}.inventory.quantity_available`,
                        errors
                    );
                }
                if (entry.inventory.is_active !== undefined && typeof entry.inventory.is_active !== 'boolean') {
                    errors.push(`${prefix}.inventory.is_active must be a boolean`);
                }
            }

            if (entry.images != null && !Array.isArray(entry.images)) {
                errors.push(`${prefix}: images must be an array`);
            }
            if (Array.isArray(entry.images)) {
                entry.images.forEach((img, j) => {
                    if (img == null || typeof img !== 'object') {
                        errors.push(`${prefix}.images[${j}] must be an object`);
                        return;
                    }
                    if (img.image_url == null || String(img.image_url).trim() === '') {
                        errors.push(`${prefix}.images[${j}]: image_url is required`);
                    }
                    if (img.is_primary !== undefined && typeof img.is_primary !== 'boolean') {
                        errors.push(`${prefix}.images[${j}]: is_primary must be a boolean`);
                    }
                });
            }
        });

        if (products.length > 1) {
            products.forEach((entry, i) => {
                if (entry == null || typeof entry !== 'object') {
                    return;
                }
                if (!entryHasProductDifferentiator(entry)) {
                    errors.push(
                        `products[${i}]: with multiple products, each needs dimensions or a size label (format_label) so variants differ`
                    );
                }
            });
            const seen = new Set();
            products.forEach((entry, i) => {
                if (entry == null || typeof entry !== 'object') {
                    return;
                }
                const fp = variantFingerprint(entry);
                if (seen.has(fp)) {
                    errors.push(
                        `products[${i}]: duplicate variant — use different dimensions or format_label per product`
                    );
                }
                seen.add(fp);
            });
        }
    }

    return errors.length ? { errors } : null;
}

module.exports = {
    validateCatalogItemBody
};
