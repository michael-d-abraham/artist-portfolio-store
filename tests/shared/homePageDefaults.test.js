const {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    mergeHomePageTextDefaults
} = require('../../shared/homePageDefaults');

describe('shared/homePageDefaults', () => {
    it('FEATURED_PRODUCT_SLOTS is 6', () => {
        expect(FEATURED_PRODUCT_SLOTS).toBe(6);
    });

    it('emptyFeaturedProduct returns expected shape', () => {
        expect(emptyFeaturedProduct()).toEqual({ product_id: '' });
    });

    it('mergeHomePageTextDefaults applies title fallbacks', () => {
        const merged = mergeHomePageTextDefaults({});
        expect(merged.featured_title).toBe(DEFAULT_HOME_PAGE.featured_title);
        expect(merged.about_title).toBe(DEFAULT_HOME_PAGE.about_title);
        expect(merged.hero_title).toBe('');
    });

    it('mergeHomePageTextDefaults preserves custom titles', () => {
        const merged = mergeHomePageTextDefaults({
            featured_title: 'Shop picks',
            about_title: 'Our story'
        });
        expect(merged.featured_title).toBe('Shop picks');
        expect(merged.about_title).toBe('Our story');
    });
});
