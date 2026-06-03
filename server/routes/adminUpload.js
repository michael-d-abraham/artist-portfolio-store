const express = require('express');
const router = express.Router();

const { uploadImage } = require('../controllers/adminUploadController');
const { uploadProductImageMiddleware } = require('../middleware/uploadProductImage');

router.post('/upload-image', uploadProductImageMiddleware, uploadImage);

module.exports = router;
