const express = require('express');
const router = express.Router();

const {
    createAdminProductImage,
    updateAdminProductImage,
    deleteAdminProductImage
} = require('../controllers/adminProductImageController');

router.post('/', createAdminProductImage);
router.put('/:id', updateAdminProductImage);
router.delete('/:id', deleteAdminProductImage);

module.exports = router;
