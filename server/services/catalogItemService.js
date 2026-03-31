const crypto = require('crypto');
const mongoose = require('mongoose');
const { Artwork, ProductType, Product, ProductImage } = require('../db');
const { slugify } = require('../utils/slugify');
const { validateCreateBody } = require('../utils/artworkValidation');
const { validateProductTypeCreateBody } = require('../utils/productTypeValidation');
const { validateCatalogItemBody } = require('../utils/catalogItemValidation');
const { buildProductSlug } = require('../utils/buildProductSlug');
const { applyProductRelations } = require('../utils/productPopulate');

function parseYearCreated(value) {
    if (value === undefined) {
        return { ok: true, value: undefined };
    }
    if (value === null) {
        return { ok: true, value: null };
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        return { ok: false, error: 'year_created must be an integer or null' };
    }
    return { ok: true, value };
}

function isDuplicateKeyError(err) {
    return err && err.code === 11000;
}

function normalizeImages(images) {
    let primarySet = false;
    return images.map((raw) => {
        const img = { ...raw };
        if (img.is_primary === true && !primarySet) {
            primarySet = true;
        } else {
            img.is_primary = false;
        }
        return img;
    });
}

async function createImagesForProduct(productId, images, session = null) {
    if (!images.length) {
        return [];
    }
    let lastQ = ProductImage.findOne({ product_id: productId, deleted_at: null })
        .sort({ sort_order: -1 })
        .select('sort_order')
        .lean();
    if (session) lastQ = lastQ.session(session);
    const last = await lastQ;
    let nextSort = last && typeof last.sort_order === 'number' ? last.sort_order + 1 : 0;

    const created = [];
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const sortOrder = img.sort_order !== undefined ? img.sort_order : nextSort;
        nextSort = sortOrder + 1;

        if (img.is_primary === true) {
            let up = ProductImage.updateMany(
                { product_id: productId, deleted_at: null },
                { $set: { is_primary: false } }
            );
            if (session) up = up.session(session);
            await up;
        }

        const doc = {
            product_id: productId,
            image_url: String(img.image_url).trim(),
            image_provider_id: img.image_provider_id == null ? null : String(img.image_provider_id).trim(),
            alt_text: img.alt_text == null ? null : String(img.alt_text).trim(),
            sort_order: sortOrder,
            is_primary: img.is_primary === true,
            deleted_at: null
        };
        if (img.is_active !== undefined) {
            doc.is_active = img.is_active;
        }
        const opts = session ? { session } : {};
        const [row] = await ProductImage.create([doc], opts);
        created.push(row);
    }
    return created;
}

async function resolveArtwork(body, session = null) {
    if (body.artwork_id) {
        let q = Artwork.findOne({ _id: body.artwork_id, deleted_at: null });
        if (session) q = q.session(session);
        const artwork = await q;
        if (!artwork) {
            return { error: 'Artwork not found', status: 404 };
        }
        return { artwork };
    }

    const createErr = validateCreateBody(body.artwork);
    if (createErr) {
        return { errors: createErr.errors, status: 400 };
    }

    const yearParsed = parseYearCreated(body.artwork.year_created);
    if (!yearParsed.ok) {
        return { error: yearParsed.error, status: 400 };
    }

    const slug = slugify(body.artwork.title);
    if (!slug) {
        return { error: 'slug could not be generated from title', status: 400 };
    }

    let existsQ = Artwork.exists({ slug });
    if (session) existsQ = existsQ.session(session);
    const slugTaken = await existsQ;
    if (slugTaken) {
        return { error: 'Artwork slug already exists', status: 400 };
    }

    const doc = {
        title: String(body.artwork.title).trim(),
        slug,
        description: String(body.artwork.description).trim(),
        deleted_at: null
    };
    if (body.artwork.is_active !== undefined) {
        doc.is_active = body.artwork.is_active;
    }
    if (yearParsed.value !== undefined) {
        doc.year_created = yearParsed.value;
    }

    try {
        const opts = session ? { session } : {};
        const [artwork] = await Artwork.create([doc], opts);
        return { artwork };
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return { error: 'Artwork slug already exists', status: 400 };
        }
        throw err;
    }
}

async function resolveProductType(body, session = null) {
    if (body.product_type_id) {
        let q = ProductType.findById(body.product_type_id);
        if (session) q = q.session(session);
        const productType = await q;
        if (!productType) {
            return { error: 'Product type not found', status: 404 };
        }
        return { productType };
    }

    const createErr = validateProductTypeCreateBody(body.product_type);
    if (createErr) {
        return { errors: createErr.errors, status: 400 };
    }

    const slug = slugify(body.product_type.name);
    if (!slug) {
        return { error: 'slug could not be generated from product type name', status: 400 };
    }

    let existsQ = ProductType.exists({ slug });
    if (session) existsQ = existsQ.session(session);
    const slugTaken = await existsQ;
    if (slugTaken) {
        return { error: 'Product type slug already exists', status: 400 };
    }

    const doc = {
        name: String(body.product_type.name).trim(),
        slug,
        description: body.product_type.description == null ? null : String(body.product_type.description).trim(),
        features: Array.isArray(body.product_type.features)
            ? body.product_type.features.map((item) => String(item).trim())
            : [],
        material: body.product_type.material == null ? null : String(body.product_type.material).trim()
    };
    if (body.product_type.is_active !== undefined) {
        doc.is_active = body.product_type.is_active;
    }

    try {
        const opts = session ? { session } : {};
        const [productType] = await ProductType.create([doc], opts);
        return { productType };
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return { error: 'Product type slug already exists', status: 400 };
        }
        throw err;
    }
}

function sizePayloadHasContent(sizeObj) {
    if (sizeObj == null || typeof sizeObj !== 'object') {
        return false;
    }
    const w = sizeObj.width;
    const h = sizeObj.height;
    const d = sizeObj.depth;
    const hasDim =
        (w !== undefined && w !== null && w !== '' && !Number.isNaN(Number(w))) ||
        (h !== undefined && h !== null && h !== '' && !Number.isNaN(Number(h))) ||
        (d !== undefined && d !== null && d !== '' && !Number.isNaN(Number(d)));
    const fl = sizeObj.format_label != null && String(sizeObj.format_label).trim() !== '';
    const sc = sizeObj.size_code != null && String(sizeObj.size_code).trim() !== '';
    return hasDim || fl || sc;
}

function formatLabelFromDimensions(width, height, depth, dimensionUnit) {
    const parts = [];
    if (width !== undefined) parts.push(String(width));
    if (height !== undefined) parts.push(String(height));
    if (depth !== undefined) parts.push(String(depth));
    if (!parts.length) return '';
    const core = parts.join(' × ');
    const u = dimensionUnit != null && String(dimensionUnit).trim();
    return u ? `${core} ${u}` : core;
}

function readNumericDim(raw, label) {
    if (raw === undefined || raw === null || raw === '') {
        return { ok: true, value: undefined };
    }
    const n = Number(raw);
    if (Number.isNaN(n)) {
        return { ok: false, error: `${label} must be a number` };
    }
    return { ok: true, value: n };
}

/**
 * Map catalog entry.size + quantities onto Product fields and a variant object for slug building.
 * @returns {{ variant: object|null, fields: object } | { error: string }}
 */
function variantAndFieldsFromCatalogEntry(entry) {
    const raw = entry.size;
    const inv = entry.inventory || {};

    const fields = {
        quantity_total: 0,
        quantity_available: 0,
        size_label: null,
        width: null,
        height: null,
        depth: null,
        dimension_unit: null
    };

    if (raw && typeof raw === 'object' && sizePayloadHasContent(raw)) {
        let dimension_unit = null;
        const dims = {};
        for (const [key, label] of [
            ['width', 'width'],
            ['height', 'height'],
            ['depth', 'depth']
        ]) {
            const r = readNumericDim(raw[key], label);
            if (!r.ok) {
                return { error: r.error };
            }
            if (r.value !== undefined) {
                dims[key] = r.value;
            }
        }
        if (raw.dimension_unit != null && String(raw.dimension_unit).trim() !== '') {
            dimension_unit = String(raw.dimension_unit).trim();
        } else if (
            dims.width !== undefined ||
            dims.height !== undefined ||
            dims.depth !== undefined
        ) {
            dimension_unit = 'in';
        }
        let format_label = raw.format_label == null ? '' : String(raw.format_label).trim();
        if (!format_label) {
            format_label = formatLabelFromDimensions(dims.width, dims.height, dims.depth, dimension_unit);
        }
        fields.size_label = format_label ? format_label : null;
        fields.width = dims.width !== undefined ? dims.width : null;
        fields.height = dims.height !== undefined ? dims.height : null;
        fields.depth = dims.depth !== undefined ? dims.depth : null;
        fields.dimension_unit = dimension_unit;
    }

    if (entry.quantity !== undefined && entry.quantity !== null) {
        fields.quantity_total = entry.quantity;
        fields.quantity_available = entry.quantity;
    } else {
        fields.quantity_total = inv.quantity_total !== undefined ? inv.quantity_total : 0;
        fields.quantity_available = inv.quantity_available !== undefined ? inv.quantity_available : 0;
    }

    const variant =
        fields.size_label ||
        fields.width != null ||
        fields.height != null ||
        fields.depth != null
            ? {
                  size_label: fields.size_label,
                  width: fields.width,
                  height: fields.height,
                  depth: fields.depth,
                  dimension_unit: fields.dimension_unit
              }
            : null;

    return { variant, fields };
}

async function runCreateCatalogItemInTransaction(body, session) {
    const artworkResult = await resolveArtwork(body, session);
    if (artworkResult.error) {
        return { ok: false, status: artworkResult.status || 400, error: artworkResult.error };
    }
    if (artworkResult.errors) {
        return { ok: false, status: artworkResult.status || 400, errors: artworkResult.errors };
    }

    const typeResult = await resolveProductType(body, session);
    if (typeResult.error) {
        return { ok: false, status: typeResult.status || 400, error: typeResult.error };
    }
    if (typeResult.errors) {
        return { ok: false, status: typeResult.status || 400, errors: typeResult.errors };
    }

    const { artwork } = artworkResult;
    const { productType } = typeResult;
    const artworkId = artwork._id;
    const typeId = productType._id;

    const products = Array.isArray(body.products) ? body.products : body.sizes;
    const items = [];

    for (let i = 0; i < products.length; i++) {
        const entry = products[i];
        const parsed = variantAndFieldsFromCatalogEntry(entry);
        if (parsed.error) {
            return { ok: false, status: 400, error: `products[${i}].size: ${parsed.error}` };
        }

        const { variant, fields } = parsed;
        const uniqueToken = crypto.randomBytes(4).toString('hex');
        const slugResult = await buildProductSlug(artworkId, typeId, variant, uniqueToken, session);
        if (slugResult.error) {
            return { ok: false, status: 400, error: slugResult.error };
        }

        let slugQ = Product.exists({ slug: slugResult.slug });
        slugQ = slugQ.session(session);
        const slugTaken = await slugQ;
        if (slugTaken) {
            return { ok: false, status: 400, error: `products[${i}]: generated slug already exists` };
        }

        const inv = entry.inventory || {};
        let isActive = true;
        if (entry.is_active !== undefined) {
            isActive = entry.is_active;
        } else if (inv.is_active !== undefined) {
            isActive = inv.is_active;
        }

        const productDoc = {
            artwork_id: artworkId,
            product_type_id: typeId,
            slug: slugResult.slug,
            price_cents: entry.price_cents,
            quantity_total: fields.quantity_total,
            quantity_available: fields.quantity_available,
            size_label: fields.size_label,
            width: fields.width,
            height: fields.height,
            depth: fields.depth,
            dimension_unit: fields.dimension_unit,
            is_active: isActive,
            deleted_at: null
        };

        let product;
        try {
            const [row] = await Product.create([productDoc], { session });
            product = row;
        } catch (err) {
            if (isDuplicateKeyError(err)) {
                const key = err.keyValue ? JSON.stringify(err.keyValue) : '';
                const hint =
                    key.includes('slug') || (err.message && err.message.includes('slug'))
                        ? ' (duplicate URL slug)'
                        : '';
                return {
                    ok: false,
                    status: 400,
                    error: `products[${i}]: could not create product (duplicate key)${hint}${key ? ` ${key}` : ''}`
                };
            }
            throw err;
        }

        const rawImages = entry.images || [];
        const normalizedImages = normalizeImages(rawImages);
        const imageDocs = await createImagesForProduct(product._id, normalizedImages, session);

        let popQ = applyProductRelations(Product.findById(product._id));
        popQ = popQ.session(session);
        const populated = await popQ.exec();

        items.push({
            product: populated,
            images: imageDocs
        });
    }

    return {
        ok: true,
        status: 201,
        data: {
            artwork,
            product_type: productType,
            items
        }
    };
}

/**
 * @param {object} body
 * @returns {Promise<{ ok: true, status: number, data: object } | { ok: false, status: number, error?: string, errors?: string[] }>}
 */
async function createCatalogItem(body) {
    const val = validateCatalogItemBody(body);
    if (val) {
        return { ok: false, status: 400, errors: val.errors };
    }

    const session = await mongoose.startSession();
    try {
        let outcome = null;
        await session.withTransaction(
            async () => {
                outcome = await runCreateCatalogItemInTransaction(body, session);
                if (!outcome.ok) {
                    const msg = outcome.error || (outcome.errors && outcome.errors.join(' ')) || 'Catalog create failed';
                    const err = new Error(msg);
                    err.__catalogOutcome = outcome;
                    throw err;
                }
            },
            { readPreference: 'primary' }
        );
        return outcome;
    } catch (err) {
        if (err && err.__catalogOutcome) {
            return err.__catalogOutcome;
        }
        throw err;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    createCatalogItem
};
