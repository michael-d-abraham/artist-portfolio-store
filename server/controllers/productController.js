const { Product, Artwork } = require('../db');
const { applyProductRelations } = require('../utils/productPopulate');

/** Artworks that may appear on the storefront (gallery + detail). */
async function storefrontArtworkIds() {
    return Artwork.find({ is_active: true, deleted_at: null }).distinct('_id');
}

const listPublicProducts = async (req, res) => {
    try {
        const allowedArtworkIds = await storefrontArtworkIds();
        const products = await applyProductRelations(
            Product.find({
                is_active: true,
                deleted_at: null,
                artwork_id: { $in: allowedArtworkIds }
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

        const allowedArtworkIds = await storefrontArtworkIds();
        const product = await applyProductRelations(
            Product.findOne({
                slug: String(productSlug).trim(),
                is_active: true,
                deleted_at: null,
                artwork_id: { $in: allowedArtworkIds }
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
