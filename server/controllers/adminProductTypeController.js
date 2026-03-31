const { ProductType } = require('../db');
const { slugify } = require('../utils/slugify');
const { isValidObjectId } = require('../utils/artworkValidation');
const {
    validateProductTypeCreateBody,
    validateProductTypeUpdateBody
} = require('../utils/productTypeValidation');

function isDuplicateKeyError(err) {
    return err && err.code === 11000;
}

function validationErrorResponse(res, messageOrResult) {
    if (messageOrResult && messageOrResult.errors) {
        return res.status(400).json({ errors: messageOrResult.errors });
    }
    return res.status(400).json({ error: typeof messageOrResult === 'string' ? messageOrResult : 'Validation failed' });
}

const listAdminProductTypes = async (req, res) => {
    try {
        const productTypes = await ProductType.find().sort({ created_at: -1 });
        res.json(productTypes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAdminProductTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product type id' });
        }

        const productType = await ProductType.findById(id);
        if (!productType) {
            return res.status(404).json({ error: 'Product type not found' });
        }
        res.json(productType);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createAdminProductType = async (req, res) => {
    try {
        const body = req.body;
        const createErr = validateProductTypeCreateBody(body);
        if (createErr) {
            return validationErrorResponse(res, createErr);
        }

        const slug = slugify(body.name);
        if (!slug) {
            return res.status(400).json({ error: 'slug could not be generated from name' });
        }

        const slugTaken = await ProductType.exists({ slug });
        if (slugTaken) {
            return res.status(400).json({ error: 'Slug already exists' });
        }

        const productType = await ProductType.create({
            name: String(body.name).trim(),
            slug,
            description: body.description == null ? null : String(body.description).trim(),
            features: Array.isArray(body.features) ? body.features.map((item) => String(item).trim()) : [],
            material: body.material == null ? null : String(body.material).trim(),
            is_active: body.is_active
        });

        res.status(201).json(productType);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAdminProductType = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product type id' });
        }

        const body = req.body;
        const updateErr = validateProductTypeUpdateBody(body);
        if (updateErr) {
            return validationErrorResponse(res, updateErr);
        }

        const productType = await ProductType.findById(id);
        if (!productType) {
            return res.status(404).json({ error: 'Product type not found' });
        }

        if (body.name !== undefined) {
            const nextName = String(body.name).trim();
            const nextSlug = slugify(nextName);
            if (!nextSlug) {
                return res.status(400).json({ error: 'slug could not be generated from name' });
            }
            if (nextSlug !== productType.slug) {
                const taken = await ProductType.exists({ slug: nextSlug, _id: { $ne: productType._id } });
                if (taken) {
                    return res.status(400).json({ error: 'Slug already exists' });
                }
                productType.slug = nextSlug;
            }
            productType.name = nextName;
        }
        if (body.description !== undefined) {
            productType.description = body.description == null ? null : String(body.description).trim();
        }
        if (body.features !== undefined) {
            productType.features = body.features.map((item) => String(item).trim());
        }
        if (body.material !== undefined) {
            productType.material = body.material == null ? null : String(body.material).trim();
        }
        if (body.is_active !== undefined) {
            productType.is_active = body.is_active;
        }

        await productType.save();
        res.json(productType);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listAdminProductTypes,
    getAdminProductTypeById,
    createAdminProductType,
    updateAdminProductType
};
