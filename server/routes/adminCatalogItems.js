const express = require('express');
const router = express.Router();

const { createAdminCatalogItem } = require('../controllers/adminCatalogItemController');

router.post('/', createAdminCatalogItem);

module.exports = router;
