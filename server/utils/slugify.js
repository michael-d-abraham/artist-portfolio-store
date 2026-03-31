/**
 * Build a URL slug from a title: lowercase, trim, alphanumerics only with hyphens.
 * @param {string} title
 * @returns {string}
 */
function slugify(title) {
    if (title == null || typeof title !== 'string') {
        return '';
    }
    return normalizeSlug(title);
}

/**
 * Normalize a user-provided slug the same way as title-based slugify.
 * @param {string} input
 * @returns {string}
 */
function normalizeSlug(input) {
    if (input == null || typeof input !== 'string') {
        return '';
    }
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

module.exports = {
    slugify,
    normalizeSlug
};
