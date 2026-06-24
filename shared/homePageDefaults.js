const FEATURED_PRODUCT_SLOTS = 6;

const DEFAULT_HOME_PAGE = {
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    featured_title: 'Featured products',
    featured_products: Array.from({ length: FEATURED_PRODUCT_SLOTS }, () => ({
        product_id: ''
    })),
    about_title: 'About',
    about_header: '',
    about_text: '',
    about_image_url: ''
};

function emptyFeaturedProduct() {
    return { product_id: '' };
}

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function mergeHomePageTextDefaults(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};

    return {
        hero_title: normalizeOptionalText(base.hero_title),
        hero_subtitle: normalizeOptionalText(base.hero_subtitle),
        hero_image_url: normalizeOptionalText(base.hero_image_url),
        featured_title:
            normalizeOptionalText(base.featured_title) || DEFAULT_HOME_PAGE.featured_title,
        about_title:
            normalizeOptionalText(base.about_title) || DEFAULT_HOME_PAGE.about_title,
        about_header: normalizeOptionalText(base.about_header),
        about_text: normalizeOptionalText(base.about_text),
        about_image_url: normalizeOptionalText(base.about_image_url)
    };
}

module.exports = {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    mergeHomePageTextDefaults
};
