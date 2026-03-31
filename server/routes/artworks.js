const express = require('express');
const router = express.Router();

const { listPublicArtworks, getPublicArtworkBySlug } = require('../controllers/artworkController');

// GET /api/artworks
router.get('/', listPublicArtworks);

// GET /api/artworks/:slug
router.get('/:slug', getPublicArtworkBySlug);

module.exports = router;