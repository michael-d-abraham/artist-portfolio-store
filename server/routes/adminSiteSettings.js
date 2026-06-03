const express = require('express');
const {
    getAdminSocialSettingsHandler,
    updateAdminSocialSettingsHandler
} = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/social-links', getAdminSocialSettingsHandler);
router.put('/social-links', updateAdminSocialSettingsHandler);

module.exports = router;
