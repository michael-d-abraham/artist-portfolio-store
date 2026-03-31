const crypto = require('crypto');

const SALT_LEN = 16;
const KEY_LEN = 64;

function hashPassword(plain) {
    const salt = crypto.randomBytes(SALT_LEN);
    const hash = crypto.scryptSync(String(plain), salt, KEY_LEN);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(plain, stored) {
    if (!stored || typeof stored !== 'string' || !stored.includes(':')) {
        return false;
    }
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    try {
        const salt = Buffer.from(saltHex, 'hex');
        const hash = Buffer.from(hashHex, 'hex');
        const test = crypto.scryptSync(String(plain), salt, KEY_LEN);
        if (hash.length !== test.length) return false;
        return crypto.timingSafeEqual(hash, test);
    } catch {
        return false;
    }
}

module.exports = { hashPassword, verifyPassword };
