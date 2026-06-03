const { ProductImage } = require('../db');

function normalizeImages(images) {
    let primarySet = false;
    return images.map((raw) => {
        const img = { ...raw };
        if (img.is_primary === true && !primarySet) {
            primarySet = true;
        } else {
            img.is_primary = false;
        }
        return img;
    });
}

async function createImagesForProduct(productId, images, session = null) {
    if (!images.length) {
        return [];
    }
    let lastQ = ProductImage.findOne({ product_id: productId, deleted_at: null })
        .sort({ sort_order: -1 })
        .select('sort_order')
        .lean();
    if (session) lastQ = lastQ.session(session);
    const last = await lastQ;
    let nextSort = last && typeof last.sort_order === 'number' ? last.sort_order + 1 : 0;

    const created = [];
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const sortOrder = img.sort_order !== undefined ? img.sort_order : nextSort;
        nextSort = sortOrder + 1;

        if (img.is_primary === true) {
            let up = ProductImage.updateMany(
                { product_id: productId, deleted_at: null },
                { $set: { is_primary: false } }
            );
            if (session) up = up.session(session);
            await up;
        }

        const doc = {
            product_id: productId,
            image_url: String(img.image_url).trim(),
            image_provider_id: img.image_provider_id == null ? null : String(img.image_provider_id).trim(),
            alt_text: img.alt_text == null ? null : String(img.alt_text).trim(),
            sort_order: sortOrder,
            is_primary: img.is_primary === true,
            deleted_at: null
        };
        if (img.is_active !== undefined) {
            doc.is_active = img.is_active;
        }
        const opts = session ? { session } : {};
        const [row] = await ProductImage.create([doc], opts);
        created.push(row);
    }
    return created;
}

async function syncImagesForProduct(productId, rawImages, session = null) {
    const images = Array.isArray(rawImages) ? normalizeImages(rawImages) : [];
    let softDelete = ProductImage.updateMany(
        { product_id: productId, deleted_at: null },
        { $set: { deleted_at: new Date() } }
    );
    if (session) softDelete = softDelete.session(session);
    await softDelete;
    if (images.length) {
        await createImagesForProduct(productId, images, session);
    }
    return images;
}

module.exports = {
    normalizeImages,
    createImagesForProduct,
    syncImagesForProduct
};
