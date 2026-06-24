const { EMAIL_RE, isValidEmail } = require('../../shared/email');

describe('shared/email', () => {
    it('EMAIL_RE matches typical addresses', () => {
        expect(EMAIL_RE.test('a@b.com')).toBe(true);
        expect(EMAIL_RE.test('user@example.org')).toBe(true);
    });

    it('isValidEmail accepts valid trimmed addresses', () => {
        expect(isValidEmail('a@b.com')).toBe(true);
        expect(isValidEmail('  user@example.org  ')).toBe(true);
    });

    it('isValidEmail rejects invalid addresses', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('not-an-email')).toBe(false);
        expect(isValidEmail('@missing-local.com')).toBe(false);
        expect(isValidEmail('missing-domain@')).toBe(false);
    });

    it('isValidEmail rejects non-strings', () => {
        expect(isValidEmail(null)).toBe(false);
        expect(isValidEmail(undefined)).toBe(false);
        expect(isValidEmail(123)).toBe(false);
    });
});
