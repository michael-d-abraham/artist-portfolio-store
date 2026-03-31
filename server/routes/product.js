const express = require('express');
const { getPublicProductBySlug } = require('../controllers/productController');

const router = express.Router();

/** GET /api/product/:slug — :slug is Product.slug (catalog identity). */
router.get('/:slug', getPublicProductBySlug);

module.exports = router;
