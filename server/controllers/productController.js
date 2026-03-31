const { Product } = require('../db');
const { applyProductRelations } = require('../utils/productPopulate');

const listPublicProducts = async (req, res) => {
    try {
        const products = await applyProductRelations(
            Product.find({
                is_active: true,
                deleted_at: null
            })
        )
            .sort({ created_at: -1 })
            .exec();

        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

/** Public detail by catalog slug — must be Product.slug (not Artwork.slug). */
const getPublicProductBySlug = async (req, res) => {
    try {
        const productSlug = req.params.slug;
        if (productSlug == null || String(productSlug).trim() === '') {
            return res.status(400).json({ error: 'Invalid slug' });
        }

        const product = await applyProductRelations(
            Product.findOne({
                slug: String(productSlug).trim(),
                is_active: true,
                deleted_at: null
            })
        ).exec();

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listPublicProducts,
    getPublicProductBySlug
};
