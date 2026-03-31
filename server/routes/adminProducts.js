const express = require('express');
const router = express.Router();

const {
    listAdminProducts,
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    upsertInventoryByProductId
} = require('../controllers/adminProductController');
const {
    listAdminProductImagesByProduct,
    setPrimaryAdminProductImage
} = require('../controllers/adminProductImageController');

router.get('/', listAdminProducts);
router.post('/', createAdminProduct);
router.get('/:productId/images', listAdminProductImagesByProduct);
router.put('/:productId/images/:imageId/primary', setPrimaryAdminProductImage);
router.put('/:productId/inventory', upsertInventoryByProductId);
router.get('/:id', getAdminProductById);
router.put('/:id', updateAdminProduct);

module.exports = router;
