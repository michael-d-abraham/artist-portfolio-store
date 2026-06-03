/**
 * Storefront display helpers — Product is the source of truth for catalog display.
 */

export function primaryProductImage(product) {
    if (!product || !Array.isArray(product.product_images)) {
        return null;
    }
    const imgs = product.product_images.filter((i) => i && i.image_url);
    if (!imgs.length) {
        return null;
    }
    const primary = imgs.find((i) => i.is_primary);
    return primary || imgs[0];
}

export function primaryProductImageUrl(product) {
    const img = primaryProductImage(product);
    return img && img.image_url ? String(img.image_url) : null;
}

export function productTitle(product) {
    if (product?.title) {
        return product.title;
    }
    return product?.slug || 'Product';
}

export function productFormat(product) {
    return product?.format ? String(product.format).trim() : '';
}

/** Gallery card title — title plus format when format isn’t already in the title. */
export function displayProductName(product) {
    const title = productTitle(product);
    const format = productFormat(product);
    if (format && !title.toLowerCase().includes(format.toLowerCase())) {
        return `${title} — ${format}`;
    }
    return title;
}

export function formatUsdFromCents(cents) {
    if (cents == null || typeof cents !== 'number') {
        return '0.00';
    }
    return (cents / 100).toFixed(2);
}
