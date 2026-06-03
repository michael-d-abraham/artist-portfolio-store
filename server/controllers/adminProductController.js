const { Product } = require('../db');
const { isValidObjectId } = require('../utils/objectIdValidation');
const { normalizeSlug } = require('../utils/slugify');
const { buildUniqueProductSlug } = require('../utils/productSlug');
const {
    validateProductCreateBody,
    validateProductUpdateBody
} = require('../utils/productValidation');
const { applyProductRelations } = require('../utils/productPopulate');
const { normalizeImages, createImagesForProduct, syncImagesForProduct } = require('../utils/productImages');

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

async function getAdminProductDetailById(id) {
    if (!isValidObjectId(id)) {
        return null;
    }
    return applyProductRelations(Product.findOne({ _id: id, deleted_at: null })).exec();
}

function applyProductFieldsFromBody(target, body, isCreate) {
    if (body.title !== undefined) {
        target.title = String(body.title).trim();
    }
    if (body.description !== undefined) {
        target.description = String(body.description).trim();
    }
    if (body.price_cents !== undefined) {
        target.price_cents = body.price_cents;
    }
    if (body.currency !== undefined) {
        target.currency = String(body.currency).trim().toLowerCase();
    }
    if (body.quantity_available !== undefined) {
        target.quantity_available = body.quantity_available;
    }
    if (body.size_label !== undefined) {
        target.size_label = normalizeNullableStringInput(body.size_label);
    }
    if (body.format !== undefined) {
        target.format = normalizeNullableStringInput(body.format);
    }
    if (body.stripe_product_id !== undefined) {
        target.stripe_product_id = normalizeNullableStringInput(body.stripe_product_id);
    }
    if (body.stripe_price_id !== undefined) {
        target.stripe_price_id = normalizeNullableStringInput(body.stripe_price_id);
    }
    if (body.is_active !== undefined) {
        target.is_active = body.is_active;
    }
    if (body.year_created !== undefined) {
        const yearParsed = parseYearCreated(body.year_created);
        if (!yearParsed.ok) {
            return yearParsed;
        }
        target.year_created = yearParsed.value;
    }
    if (isCreate && body.is_active === undefined) {
        target.is_active = true;
    }
    return { ok: true };
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

const createAdminProduct = async (req, res) => {
    try {
        const body = req.body;
        const createErr = validateProductCreateBody(body);
        if (createErr) {
            return validationErrorResponse(res, createErr);
        }

        const yearParsed = parseYearCreated(body.year_created);
        if (!yearParsed.ok) {
            return res.status(400).json({ error: yearParsed.error });
        }

        let slug;
        if (body.slug != null && String(body.slug).trim() !== '') {
            slug = normalizeSlug(body.slug);
            if (!slug) {
                return res.status(400).json({ error: 'slug is invalid' });
            }
            const taken = await Product.exists({ slug });
            if (taken) {
                return res.status(400).json({ error: 'Slug already exists' });
            }
        } else {
            slug = await buildUniqueProductSlug(body.title);
            if (!slug) {
                return res.status(400).json({ error: 'slug could not be generated from title' });
            }
        }

        const doc = {
            title: String(body.title).trim(),
            slug,
            description: String(body.description).trim(),
            price_cents: body.price_cents,
            currency: body.currency != null ? String(body.currency).trim().toLowerCase() : 'usd',
            quantity_available: body.quantity_available !== undefined ? body.quantity_available : 0,
            size_label: normalizeNullableStringInput(body.size_label) ?? null,
            format: normalizeNullableStringInput(body.format) ?? null,
            stripe_product_id: normalizeNullableStringInput(body.stripe_product_id) ?? null,
            stripe_price_id: normalizeNullableStringInput(body.stripe_price_id) ?? null,
            is_active: body.is_active !== undefined ? body.is_active : true,
            deleted_at: null
        };
        if (yearParsed.value !== undefined) {
            doc.year_created = yearParsed.value;
        }

        const product = await Product.create(doc);
        const rawImages = Array.isArray(body.images) ? body.images : [];
        if (rawImages.length) {
            await createImagesForProduct(product._id, normalizeImages(rawImages));
        }

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

        const fieldResult = applyProductFieldsFromBody(product, body, false);
        if (!fieldResult.ok) {
            return res.status(400).json({ error: fieldResult.error });
        }

        if (body.slug !== undefined) {
            const nextSlug = normalizeSlug(body.slug);
            if (!nextSlug) {
                return res.status(400).json({ error: 'slug is invalid' });
            }
            if (nextSlug !== product.slug) {
                const taken = await Product.exists({ slug: nextSlug, _id: { $ne: product._id } });
                if (taken) {
                    return res.status(400).json({ error: 'Slug already exists' });
                }
                product.slug = nextSlug;
            }
        } else if (body.title !== undefined && String(body.title).trim() !== product.title) {
            const nextSlug = await buildUniqueProductSlug(body.title, product._id);
            if (!nextSlug) {
                return res.status(400).json({ error: 'slug could not be generated from title' });
            }
            product.slug = nextSlug;
        }

        await product.save();

        if (body.images !== undefined) {
            await syncImagesForProduct(product._id, body.images);
        }

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

const softDeleteAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        const now = new Date();
        const product = await Product.findOneAndUpdate(
            { _id: id, deleted_at: null },
            { deleted_at: now, is_active: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const toggleAdminProductActive = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        const product = await Product.findOne({ _id: id, deleted_at: null });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.is_active = !product.is_active;
        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listAdminProducts,
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    softDeleteAdminProduct,
    toggleAdminProductActive,
    getAdminProductDetailById
};
