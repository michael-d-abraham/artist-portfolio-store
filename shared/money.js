function dollarsToCents(d) {
    const n = Number(d);
    if (!Number.isFinite(n) || n < 0) {
        return NaN;
    }
    return Math.round(n * 100);
}

function formatMoneyFromCents(cents, currency = 'usd') {
    if (cents == null || typeof cents !== 'number') {
        return '—';
    }
    const code = String(currency || 'usd').toUpperCase();
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: code
        }).format(cents / 100);
    } catch {
        return `${(cents / 100).toFixed(2)} ${code}`;
    }
}

module.exports = { dollarsToCents, formatMoneyFromCents };
