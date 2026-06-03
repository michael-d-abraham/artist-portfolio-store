const express = require('express');
const {
    listPublicProducts,
    getPublicProductBySlug
} = require('../controllers/productController');

const listRouter = express.Router();
listRouter.get('/', listPublicProducts);

const detailRouter = express.Router();
/** GET /api/product/:slug — slug is Product.slug */
detailRouter.get('/:slug', getPublicProductBySlug);

module.exports = {
    listRouter,
    detailRouter
};
