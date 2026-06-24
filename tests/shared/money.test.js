const { dollarsToCents, formatMoneyFromCents } = require('../../shared/money');

describe('shared/money', () => {
    describe('formatMoneyFromCents', () => {
        it('formats valid USD cents', () => {
            expect(formatMoneyFromCents(12345, 'usd')).toBe('$123.45');
        });

        it('formats zero', () => {
            expect(formatMoneyFromCents(0, 'usd')).toBe('$0.00');
        });

        it('returns em dash for invalid cents', () => {
            expect(formatMoneyFromCents(null, 'usd')).toBe('—');
            expect(formatMoneyFromCents(undefined, 'usd')).toBe('—');
            expect(formatMoneyFromCents('100', 'usd')).toBe('—');
        });

        it('falls back for invalid currency code', () => {
            expect(formatMoneyFromCents(100, 'not-a-currency')).toBe('1.00 NOT-A-CURRENCY');
        });
    });

    describe('dollarsToCents', () => {
        it('converts dollars to integer cents', () => {
            expect(dollarsToCents(12.34)).toBe(1234);
            expect(dollarsToCents(0)).toBe(0);
        });

        it('returns NaN for invalid or negative input', () => {
            expect(Number.isNaN(dollarsToCents(-1))).toBe(true);
            expect(Number.isNaN(dollarsToCents('abc'))).toBe(true);
        });
    });
});
