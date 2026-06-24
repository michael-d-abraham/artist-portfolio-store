const {
    PLATFORMS,
    DEFAULT_SOCIAL_LINKS,
    PLATFORM_LABELS,
    isValidHttpUrl
} = require('../../shared/socialLinksDefaults');

describe('shared/socialLinksDefaults', () => {
    it('exports platforms in expected order', () => {
        expect(PLATFORMS).toEqual(['youtube', 'instagram', 'tiktok', 'facebook']);
    });

    it('DEFAULT_SOCIAL_LINKS has enabled entries for every platform', () => {
        for (const platform of PLATFORMS) {
            expect(DEFAULT_SOCIAL_LINKS[platform]).toEqual(
                expect.objectContaining({
                    enabled: true,
                    url: expect.stringMatching(/^https:\/\//)
                })
            );
            expect(PLATFORM_LABELS[platform].length).toBeGreaterThan(0);
        }
    });

    it('isValidHttpUrl accepts http and https only', () => {
        expect(isValidHttpUrl('https://example.com')).toBe(true);
        expect(isValidHttpUrl('http://example.com/path')).toBe(true);
        expect(isValidHttpUrl('not-a-url')).toBe(false);
        expect(isValidHttpUrl('ftp://example.com')).toBe(false);
        expect(isValidHttpUrl('')).toBe(false);
    });
});
