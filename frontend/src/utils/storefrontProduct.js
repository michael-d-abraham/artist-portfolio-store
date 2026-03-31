/**
 * Storefront display helpers — products (with populated artwork, type, images) are the source of truth.
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

export function artworkTitleFromProduct(product) {
    const a = product?.artwork_id;
    if (a && typeof a === 'object' && a.title) {
        return a.title;
    }
    return product?.slug || 'Product';
}

export function productTypeName(product) {
    const t = product?.product_type_id;
    if (t && typeof t === 'object' && t.name) {
        return t.name;
    }
    return '';
}

export function formatUsdFromCents(cents) {
    if (cents == null || typeof cents !== 'number') {
        return '0.00';
    }
    return (cents / 100).toFixed(2);
}
