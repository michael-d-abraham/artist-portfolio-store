const express = require('express');
const {
    getPublicSocialLinksHandler,
    getPublicContactHeroHandler,
    getPublicContactEmailHandler
} = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/social-links', getPublicSocialLinksHandler);
router.get('/contact-hero', getPublicContactHeroHandler);
router.get('/contact-email', getPublicContactEmailHandler);

module.exports = router;
