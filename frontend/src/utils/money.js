export function formatMoneyFromCents(cents, currency = 'usd') {
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
