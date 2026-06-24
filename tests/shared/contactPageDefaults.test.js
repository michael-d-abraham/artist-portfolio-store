const { DEFAULT_CONTACT_PAGE, mergeContactPageLabels } = require('../../shared/contactPageDefaults');

describe('shared/contactPageDefaults', () => {
    it('mergeContactPageLabels fills empty stored fields', () => {
        expect(mergeContactPageLabels({})).toEqual(DEFAULT_CONTACT_PAGE);
    });

    it('mergeContactPageLabels preserves custom text', () => {
        const merged = mergeContactPageLabels({
            page_title: 'Reach out',
            form_name_label: 'Full name'
        });
        expect(merged.page_title).toBe('Reach out');
        expect(merged.form_name_label).toBe('Full name');
        expect(merged.form_email_label).toBe(DEFAULT_CONTACT_PAGE.form_email_label);
    });

    it('mergeContactPageLabels defaults show_hero_image to true', () => {
        expect(mergeContactPageLabels({ show_hero_image: undefined }).show_hero_image).toBe(true);
        expect(mergeContactPageLabels({ show_hero_image: false }).show_hero_image).toBe(false);
    });
});
