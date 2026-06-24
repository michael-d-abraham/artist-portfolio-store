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
    return img && img.image_url ? String(img.image_url) : null;
}

function displayProductName(product) {
    const title = product?.title || (product?.slug ? String(product.slug) : 'Product');
    const format = product?.format ? String(product.format).trim() : '';
    if (format && !title.toLowerCase().includes(format.toLowerCase())) {
        return `${title} — ${format}`;
    }
    return title;
}

module.exports = {
    primaryProductImage,
    primaryProductImageUrl,
    displayProductName
};
