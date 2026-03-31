const { Artwork, ProductType } = require('../db');
const { slugify } = require('./slugify');

/**
 * Human-visible middle segment for URLs when optional variant fields are set.
 * @param {object|null|undefined} variant Optional { size_label?, width?, height?, depth?, dimension_unit? }
 * @returns {string}
 */
function variantMiddleSlugPart(variant) {
    if (variant == null || typeof variant !== 'object') {
        return '';
    }
    const label = variant.size_label != null && String(variant.size_label).trim();
    if (label) {
        return slugify(label) || 'size';
    }
    const w = variant.width;
    const h = variant.height;
    const d = variant.depth;
    const parts = [];
    if (w !== undefined && w !== null && !Number.isNaN(Number(w))) {
        parts.push(String(Number(w)));
    }
    if (h !== undefined && h !== null && !Number.isNaN(Number(h))) {
        parts.push(String(Number(h)));
    }
    if (d !== undefined && d !== null && !Number.isNaN(Number(d))) {
        parts.push(String(Number(d)));
    }
    if (!parts.length) {
        return '';
    }
    const core = parts.join('x');
    const u = variant.dimension_unit != null && String(variant.dimension_unit).trim();
    const glued = u ? `${core}-${u}` : core;
    return slugify(glued) || 'dims';
}

/**
 * Build a unique catalog slug from artwork + type + optional variant fields + token.
 * @param {string} artworkId
 * @param {string} productTypeId
 * @param {object|null|undefined} variant Optional size fields (see variantMiddleSlugPart)
 * @param {string} uniqueSlugToken Short unique suffix (random on create, stable from product id on update)
 * @param {import('mongoose').ClientSession|null} [session]
 * @returns {Promise<{ slug: string, artwork: object, productType: object } | { error: string }>}
 */
async function buildProductSlug(artworkId, productTypeId, variant, uniqueSlugToken, session = null) {
    const artQ = Artwork.findById(artworkId);
    const typeQ = ProductType.findById(productTypeId);
    if (session) {
        artQ.session(session);
        typeQ.session(session);
    }
    const [artwork, productType] = await Promise.all([artQ, typeQ]);

    if (!artwork) {
        return { error: 'artwork_id does not reference an existing Artwork' };
    }
    if (!productType) {
        return { error: 'product_type_id does not reference an existing ProductType' };
    }

    const token = uniqueSlugToken != null ? String(uniqueSlugToken).trim() : '';
    if (!token) {
        return { error: 'unique_slug_token is required' };
    }

    const middle = variantMiddleSlugPart(variant);
    const raw = middle
        ? `${artwork.slug}-${productType.slug}-${middle}-${token}`
        : `${artwork.slug}-${productType.slug}-${token}`;
    const slug = slugify(raw);
    if (!slug) {
        return { error: 'slug could not be generated from artwork, type, and token' };
    }
    return { slug, artwork, productType };
}

module.exports = {
    buildProductSlug
};
