const express = require('express');
const { listPublicProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/', listPublicProducts);

module.exports = router;
