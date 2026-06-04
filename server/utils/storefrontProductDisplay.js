function primaryProductImage(product) {
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

function primaryProductImageUrl(product) {
    const img = primaryProductImage(product);
    return img && img.image_url ? String(img.image_url) : '';
}

function productTitle(product) {
    if (product?.title) {
        return String(product.title);
    }
    return product?.slug ? String(product.slug) : 'Product';
}

function productFormat(product) {
    return product?.format ? String(product.format).trim() : '';
}

function displayProductName(product) {
    const title = productTitle(product);
    const format = productFormat(product);
    if (format && !title.toLowerCase().includes(format.toLowerCase())) {
        return `${title} — ${format}`;
    }
    return title;
}

function formatUsdFromCents(cents) {
    if (cents == null || typeof cents !== 'number') {
        return '$0.00';
    }
    return `$${(cents / 100).toFixed(2)}`;
}

module.exports = {
    primaryProductImageUrl,
    displayProductName,
    formatUsdFromCents
};
