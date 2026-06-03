const express = require('express');
const router = express.Router();

const {
    listAdminProducts,
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    softDeleteAdminProduct,
    toggleAdminProductActive
} = require('../controllers/adminProductController');

router.get('/', listAdminProducts);
router.post('/', createAdminProduct);
router.patch('/:id/toggle-active', toggleAdminProductActive);
router.get('/:id', getAdminProductById);
router.put('/:id', updateAdminProduct);
router.delete('/:id', softDeleteAdminProduct);

module.exports = router;
