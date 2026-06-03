const { uploadProductImage } = require('../services/r2StorageService');

async function uploadImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
        }

        const imageUrl = await uploadProductImage({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname
        });

        return res.json({ image_url: imageUrl });
    } catch (err) {
        console.error('admin upload-image', err);

        if (err.code === 'R2_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Image storage is not configured on the server.' });
        }
        if (err.code === 'INVALID_IMAGE') {
            return res.status(400).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to upload image' });
    }
}

module.exports = { uploadImage };
