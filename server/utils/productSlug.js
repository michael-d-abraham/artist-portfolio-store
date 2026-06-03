const crypto = require('crypto');
const { Product } = require('../db');
const { slugify } = require('./slugify');

/**
 * @param {string} title
 * @param {import('mongoose').Types.ObjectId|string|null} [excludeId]
 * @returns {Promise<string>}
 */
async function buildUniqueProductSlug(title, excludeId = null) {
    const base = slugify(title);
    if (!base) {
        return '';
    }
    let candidate = base;
    let n = 0;
    while (true) {
        const filter = { slug: candidate };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }
        const taken = await Product.exists(filter);
        if (!taken) {
            return candidate;
        }
        n += 1;
        const suffix = n < 3 ? String(n) : crypto.randomBytes(3).toString('hex');
        candidate = `${base}-${suffix}`;
    }
}

module.exports = {
    buildUniqueProductSlug
};
