const path = require('path');
const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
]);

const MIME_TO_EXT = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};

/**
 * Detect the real image type from the file's magic bytes so we never trust the
 * client-supplied Content-Type. Returns a MIME string or null if unrecognized.
 * @param {Buffer} buffer
 * @returns {string|null}
 */
function detectImageMime(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
        return null;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return 'image/png';
    }
    // GIF: "GIF8"
    if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
    ) {
        return 'image/gif';
    }
    // WEBP: "RIFF" .... "WEBP"
    if (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return 'image/webp';
    }
    return null;
}

let s3Client = null;

function assertR2Config() {
    const required = [
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_ENDPOINT',
        'R2_PUBLIC_URL'
    ];
    const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());
    if (missing.length) {
        const err = new Error(`R2 storage is not configured. Missing: ${missing.join(', ')}`);
        err.code = 'R2_NOT_CONFIGURED';
        throw err;
    }
}

function getS3Client() {
    assertR2Config();
    if (!s3Client) {
        s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
            }
        });
    }
    return s3Client;
}

function resolveExtension(mimeType, originalName) {
    if (MIME_TO_EXT[mimeType]) {
        return MIME_TO_EXT[mimeType];
    }
    const ext = path.extname(originalName || '').toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        return ext === '.jpeg' ? '.jpg' : ext;
    }
    return '.jpg';
}

function buildPublicUrl(key) {
    const base = String(process.env.R2_PUBLIC_URL).replace(/\/$/, '');
    return `${base}/${key}`;
}

/**
 * Upload a product image buffer to R2 under products/{uuid}.{ext}.
 * @returns {Promise<string>} Public image URL
 */
async function uploadProductImage({ buffer, mimeType, originalName }) {
    if (!buffer || !buffer.length) {
        const err = new Error('Image file is empty');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

    const claimedMime = String(mimeType || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(claimedMime)) {
        const err = new Error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

    // Trust the file's actual magic bytes, not the client-declared Content-Type.
    const detectedMime = detectImageMime(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
        const err = new Error('File is not a valid JPEG, PNG, WebP, or GIF image.');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

    const mime = detectedMime;
    const ext = resolveExtension(mime, originalName);
    const filename = `${randomUUID()}${ext}`;
    const key = `products/${filename}`;

    const client = getS3Client();
    await client.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mime
        })
    );

    return buildPublicUrl(key);
}

module.exports = {
    uploadProductImage,
    assertR2Config,
    detectImageMime
};
