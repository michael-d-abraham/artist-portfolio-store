const express = require('express');
const router = express.Router();

const {
    listAdminProductTypes,
    getAdminProductTypeById,
    createAdminProductType,
    updateAdminProductType
} = require('../controllers/adminProductTypeController');

router.get('/', listAdminProductTypes);
router.post('/', createAdminProductType);
router.get('/:id', getAdminProductTypeById);
router.put('/:id', updateAdminProductType);

module.exports = router;
