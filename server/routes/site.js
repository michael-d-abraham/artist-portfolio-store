const express = require('express');
const { getPublicSocialLinksHandler } = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/social-links', getPublicSocialLinksHandler);

module.exports = router;
