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

module.exports = {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct
};
