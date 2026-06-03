/**
 * Server-side product display helpers for checkout / fulfillment.
 */

function primaryProductImageUrl(product) {
    const imgs = product.product_images;
    if (!Array.isArray(imgs) || !imgs.length) {
        return null;
    }
    const withUrl = imgs.filter((i) => i && i.image_url);
    if (!withUrl.length) {
        return null;
    }
    const primary = withUrl.find((i) => i.is_primary);
    const img = primary || withUrl[0];
    return img.image_url ? String(img.image_url) : null;
}

function lineItemDisplayName(product) {
    const title = product.title || 'Product';
    const format = product.format ? String(product.format).trim() : '';
    if (format && !title.toLowerCase().includes(format.toLowerCase())) {
        return `${title} — ${format}`;
    }
    return title;
}

module.exports = {
    primaryProductImageUrl,
    lineItemDisplayName
};
