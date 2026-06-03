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

    const mime = String(mimeType || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
        const err = new Error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

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
    assertR2Config
};
