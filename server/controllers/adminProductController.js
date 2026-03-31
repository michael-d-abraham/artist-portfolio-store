const crypto = require('crypto');
const { Product } = require('../db');
const { isValidObjectId } = require('../utils/artworkValidation');
const { buildProductSlug } = require('../utils/buildProductSlug');
const {
    validateProductCreateBody,
    validateProductUpdateBody,
    validateProductQuantityPatchBody
} = require('../utils/productValidation');
const { applyProductRelations } = require('../utils/productPopulate');

function isDuplicateKeyError(err) {
    return err && err.code === 11000;
}

function validationErrorResponse(res, messageOrResult) {
    if (messageOrResult && messageOrResult.errors) {
        return res.status(400).json({ errors: messageOrResult.errors });
    }
    return res.status(400).json({ error: typeof messageOrResult === 'string' ? messageOrResult : 'Validation failed' });
}

function normalizeNullableStringInput(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null || value === '') {
        return null;
    }
    const t = String(value).trim();
    return t || null;
}

function optionalNumberOrNull(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null || value === '') {
        return null;
    }
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
}

/** Plain object for slug middle segment — only defined keys with non-null values. */
function variantForSlugFromValues(size_label, width, height, depth, dimension_unit) {
    const v = {};
    if (size_label != null && String(size_label).trim()) {
        v.size_label = String(size_label).trim();
    }
    if (width != null && !Number.isNaN(Number(width))) {
        v.width = Number(width);
    }
    if (height != null && !Number.isNaN(Number(height))) {
        v.height = Number(height);
    }
    if (depth != null && !Number.isNaN(Number(depth))) {
        v.depth = Number(depth);
    }
    if (dimension_unit != null && String(dimension_unit).trim()) {
        v.dimension_unit = String(dimension_unit).trim();
    }
    return Object.keys(v).length ? v : null;
}

function variantForSlugFromProductDoc(product) {
    return variantForSlugFromValues(
        product.size_label,
        product.width,
        product.height,
        product.depth,
        product.dimension_unit
    );
}

function applyCreateSizeFieldsFromBody(target, body) {
    if (body.size_label !== undefined) {
        target.size_label = normalizeNullableStringInput(body.size_label);
    }
    if (body.width !== undefined) {
        target.width = optionalNumberOrNull(body.width);
    }
    if (body.height !== undefined) {
        target.height = optionalNumberOrNull(body.height);
    }
    if (body.depth !== undefined) {
        target.depth = optionalNumberOrNull(body.depth);
    }
    if (body.dimension_unit !== undefined) {
        target.dimension_unit = normalizeNullableStringInput(body.dimension_unit);
    }
}

/**
 * Admin product detail with artwork, type, product_images populated.
 * @param {string} id Product _id
 * @returns {Promise<import('mongoose').Document | null>}
 */
async function getAdminProductDetailById(id) {
    if (!isValidObjectId(id)) {
        return null;
    }
    return applyProductRelations(Product.findOne({ _id: id, deleted_at: null })).exec();
}

const listAdminProducts = async (req, res) => {
    try {
        const products = await applyProductRelations(
            Product.find({ deleted_at: null }).sort({ created_at: -1 })
        ).exec();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAdminProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        const product = await getAdminProductDetailById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

function stableSlugTokenFromProductId(productDoc) {
    return `u${String(productDoc._id).replace(/[^a-f0-9]/gi, '').slice(-12)}`;
}

const createAdminProduct = async (req, res) => {
    try {
        const body = req.body;
        const createErr = validateProductCreateBody(body);
        if (createErr) {
            return validationErrorResponse(res, createErr);
        }

        const uniqueToken = crypto.randomBytes(4).toString('hex');
        const nl = normalizeNullableStringInput(body.size_label) ?? null;
        const vw = optionalNumberOrNull(body.width) ?? null;
        const vh = optionalNumberOrNull(body.height) ?? null;
        const vd = optionalNumberOrNull(body.depth) ?? null;
        const du = normalizeNullableStringInput(body.dimension_unit) ?? null;
        const variant = variantForSlugFromValues(nl, vw, vh, vd, du);

        const slugResult = await buildProductSlug(body.artwork_id, body.product_type_id, variant, uniqueToken);
        if (slugResult.error) {
            return res.status(400).json({ error: slugResult.error });
        }

        const productSlugTaken = await Product.exists({ slug: slugResult.slug });
        if (productSlugTaken) {
            return res.status(400).json({ error: 'Slug already exists' });
        }

        const doc = {
            artwork_id: body.artwork_id,
            product_type_id: body.product_type_id,
            slug: slugResult.slug,
            price_cents: body.price_cents,
            quantity_total: body.quantity_total !== undefined ? body.quantity_total : 0,
            quantity_available: body.quantity_available !== undefined ? body.quantity_available : 0,
            size_label: nl,
            width: vw,
            height: vh,
            depth: vd,
            dimension_unit: du,
            is_active: body.is_active !== undefined ? body.is_active : true,
            deleted_at: null
        };

        const product = await Product.create(doc);

        const populated = await getAdminProductDetailById(product._id.toString());
        res.status(201).json(populated);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Duplicate product or slug' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        const body = req.body;
        const updateErr = validateProductUpdateBody(body);
        if (updateErr) {
            return validationErrorResponse(res, updateErr);
        }

        const product = await Product.findOne({ _id: id, deleted_at: null });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const nextArtworkId = body.artwork_id !== undefined ? body.artwork_id : product.artwork_id;
        const nextProductTypeId = body.product_type_id !== undefined ? body.product_type_id : product.product_type_id;

        applyCreateSizeFieldsFromBody(product, body);
        if (body.price_cents !== undefined) {
            product.price_cents = body.price_cents;
        }
        if (body.quantity_total !== undefined) {
            product.quantity_total = body.quantity_total;
        }
        if (body.quantity_available !== undefined) {
            product.quantity_available = body.quantity_available;
        }
        if (body.is_active !== undefined) {
            product.is_active = body.is_active;
        }
        product.artwork_id = nextArtworkId;
        product.product_type_id = nextProductTypeId;

        const token = stableSlugTokenFromProductId(product);
        const variant = variantForSlugFromProductDoc(product);
        const slugResult = await buildProductSlug(nextArtworkId, nextProductTypeId, variant, token);
        if (slugResult.error) {
            return res.status(400).json({ error: slugResult.error });
        }

        if (slugResult.slug !== product.slug) {
            const slugTaken = await Product.exists({ slug: slugResult.slug, _id: { $ne: product._id } });
            if (slugTaken) {
                return res.status(400).json({ error: 'Slug already exists' });
            }
        }
        product.slug = slugResult.slug;

        await product.save();
        const populated = await getAdminProductDetailById(product._id.toString());
        res.json(populated);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Duplicate product or slug' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Former PUT /api/admin/products/:productId/inventory — quantities (and is_active) now live on Product.
 */
const upsertInventoryByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        const body = req.body == null ? {} : req.body;
        const updateErr = validateProductQuantityPatchBody(body);
        if (updateErr) {
            return validationErrorResponse(res, updateErr);
        }

        const product = await Product.findOne({ _id: productId, deleted_at: null });
        if (!product) {
            return res.status(400).json({ error: 'productId does not reference an existing Product' });
        }

        if (body.quantity_total !== undefined) {
            product.quantity_total = body.quantity_total;
        }
        if (body.quantity_available !== undefined) {
            product.quantity_available = body.quantity_available;
        }
        if (body.is_active !== undefined) {
            product.is_active = body.is_active;
        }
        await product.save();

        const populated = await getAdminProductDetailById(productId);
        return res.json(populated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listAdminProducts,
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    getAdminProductDetailById,
    upsertInventoryByProductId
};
