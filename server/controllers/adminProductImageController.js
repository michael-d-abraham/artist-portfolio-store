const { ProductImage, Product } = require('../db');
const { isValidObjectId } = require('../utils/artworkValidation');
const {
    validateProductImageCreateBody,
    validateProductImageUpdateBody
} = require('../utils/productImageValidation');

function validationErrorResponse(res, messageOrResult) {
    if (messageOrResult && messageOrResult.errors) {
        return res.status(400).json({ errors: messageOrResult.errors });
    }
    return res.status(400).json({ error: typeof messageOrResult === 'string' ? messageOrResult : 'Validation failed' });
}

async function productExists(productId) {
    return Product.exists({ _id: productId, deleted_at: null });
}

async function unsetPrimaryForProductExcept(productId, exceptId) {
    await ProductImage.updateMany(
        {
            product_id: productId,
            _id: { $ne: exceptId },
            deleted_at: null
        },
        { $set: { is_primary: false } }
    );
}

async function nextSortOrder(productId) {
    const last = await ProductImage.findOne({ product_id: productId, deleted_at: null })
        .sort({ sort_order: -1 })
        .select('sort_order')
        .lean();
    return last && typeof last.sort_order === 'number' ? last.sort_order + 1 : 0;
}

const createAdminProductImage = async (req, res) => {
    try {
        const body = req.body;
        const err = validateProductImageCreateBody(body);
        if (err) {
            return validationErrorResponse(res, err);
        }

        if (!(await productExists(body.product_id))) {
            return res.status(400).json({ error: 'product_id does not reference an existing Product' });
        }

        const sortOrder = body.sort_order !== undefined ? body.sort_order : await nextSortOrder(body.product_id);
        const isPrimary = body.is_primary === true;

        if (isPrimary) {
            await ProductImage.updateMany(
                { product_id: body.product_id, deleted_at: null },
                { $set: { is_primary: false } }
            );
        }

        const doc = {
            product_id: body.product_id,
            image_url: String(body.image_url).trim(),
            image_provider_id: body.image_provider_id == null ? null : String(body.image_provider_id).trim(),
            alt_text: body.alt_text == null ? null : String(body.alt_text).trim(),
            sort_order: sortOrder,
            is_primary: isPrimary,
            deleted_at: null
        };
        if (body.is_active !== undefined) {
            doc.is_active = body.is_active;
        }
        const image = await ProductImage.create(doc);

        res.status(201).json(image);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

const listAdminProductImagesByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }

        if (!(await productExists(productId))) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const images = await ProductImage.find({ product_id: productId, deleted_at: null })
            .sort({ sort_order: 1, created_at: 1 });

        res.json(images);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAdminProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product image id' });
        }

        const body = req.body;
        const err = validateProductImageUpdateBody(body);
        if (err) {
            return validationErrorResponse(res, err);
        }

        const image = await ProductImage.findOne({ _id: id, deleted_at: null });
        if (!image) {
            return res.status(404).json({ error: 'Product image not found' });
        }

        if (body.image_url !== undefined) {
            image.image_url = String(body.image_url).trim();
        }
        if (body.image_provider_id !== undefined) {
            image.image_provider_id = body.image_provider_id == null ? null : String(body.image_provider_id).trim();
        }
        if (body.alt_text !== undefined) {
            image.alt_text = body.alt_text == null ? null : String(body.alt_text).trim();
        }
        if (body.sort_order !== undefined) {
            image.sort_order = body.sort_order;
        }
        if (body.is_active !== undefined) {
            image.is_active = body.is_active;
        }

        if (body.is_primary === true) {
            await unsetPrimaryForProductExcept(image.product_id, image._id);
            image.is_primary = true;
        } else if (body.is_primary === false) {
            image.is_primary = false;
        }

        await image.save();
        res.json(image);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteAdminProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid product image id' });
        }

        const image = await ProductImage.findOneAndUpdate(
            { _id: id, deleted_at: null },
            { deleted_at: new Date() },
            { new: true }
        );

        if (!image) {
            return res.status(404).json({ error: 'Product image not found' });
        }

        res.json(image);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

const setPrimaryAdminProductImage = async (req, res) => {
    try {
        const { productId, imageId } = req.params;
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ error: 'Invalid product id' });
        }
        if (!isValidObjectId(imageId)) {
            return res.status(400).json({ error: 'Invalid product image id' });
        }

        if (!(await productExists(productId))) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const image = await ProductImage.findOne({
            _id: imageId,
            product_id: productId,
            deleted_at: null
        });
        if (!image) {
            return res.status(404).json({ error: 'Product image not found' });
        }

        await unsetPrimaryForProductExcept(productId, image._id);
        image.is_primary = true;
        await image.save();

        res.json(image);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createAdminProductImage,
    listAdminProductImagesByProduct,
    updateAdminProductImage,
    deleteAdminProductImage,
    setPrimaryAdminProductImage
};
