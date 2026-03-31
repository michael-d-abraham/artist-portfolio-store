const { Artwork } = require('../db');

const listPublicArtworks = async (req, res) => {
    try {
        const artworks = await Artwork.find({
            is_active: true,
            deleted_at: null
        }).sort({ created_at: -1 });

        res.json(artworks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getPublicArtworkBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const artwork = await Artwork.findOne({
            slug,
            is_active: true,
            deleted_at: null
        });

        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        res.json(artwork);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listPublicArtworks,
    getPublicArtworkBySlug
};