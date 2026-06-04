const express = require('express');
const {
    getAdminSocialSettingsHandler,
    updateAdminSocialSettingsHandler,
    getAdminDisplayPicturesHandler,
    updateAdminDisplayPicturesHandler,
    getAdminHomePageHandler,
    updateAdminHomePageHandler
} = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/social-links', getAdminSocialSettingsHandler);
router.put('/social-links', updateAdminSocialSettingsHandler);
router.get('/display-pictures', getAdminDisplayPicturesHandler);
router.put('/display-pictures', updateAdminDisplayPicturesHandler);
router.get('/home-page', getAdminHomePageHandler);
router.put('/home-page', updateAdminHomePageHandler);

module.exports = router;
