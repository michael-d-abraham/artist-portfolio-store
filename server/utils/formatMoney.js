/**
 * @param {number} cents
 * @param {string} [currency]
 */
function formatMoneyFromCents(cents, currency = 'usd') {
    const amount = typeof cents === 'number' && Number.isFinite(cents) ? cents / 100 : 0;
    const code = String(currency || 'usd').toUpperCase();
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code
        }).format(amount);
    } catch {
        return `$${amount.toFixed(2)}`;
    }
}

module.exports = { formatMoneyFromCents };
