const multer = require('multer');

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES },
    fileFilter(req, file, cb) {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

function uploadProductImageMiddleware(req, res, next) {
    upload.single('image')(req, res, function (err) {
        if (err) {
            const message =
                err.code === 'LIMIT_FILE_SIZE'
                    ? 'Image must be 10 MB or smaller'
                    : err.message || 'Invalid upload';
            return res.status(400).json({ error: message });
        }
        next();
    });
}

module.exports = { uploadProductImageMiddleware };
