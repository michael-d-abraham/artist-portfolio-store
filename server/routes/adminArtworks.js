const express = require('express');
const router = express.Router();

const {
    listAdminArtworks,
    getAdminArtworkById,
    createAdminArtwork,
    updateAdminArtwork,
    softDeleteAdminArtwork,
    toggleAdminArtworkActive
} = require('../controllers/adminArtworkController');

router.get('/', listAdminArtworks);
router.post('/', createAdminArtwork);
router.patch('/:id/toggle-active', toggleAdminArtworkActive);
router.get('/:id', getAdminArtworkById);
router.put('/:id', updateAdminArtwork);
router.delete('/:id', softDeleteAdminArtwork);

module.exports = router;
