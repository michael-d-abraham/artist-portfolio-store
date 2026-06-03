/**
 * One-time migration: copy Artwork + ProductType fields onto Product, drop legacy FK fields.
 * Run: npm run migrate:catalog
 * Safe to delete this script after every environment has been migrated.
 */
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function formatLabelFromDims(doc) {
    if (doc.size_label) {
        return String(doc.size_label).trim() || null;
    }
    const parts = [];
    if (doc.width != null) parts.push(String(doc.width));
    if (doc.height != null) parts.push(String(doc.height));
    if (doc.depth != null) parts.push(String(doc.depth));
    if (!parts.length) return null;
    const core = parts.join(' × ');
    const u = doc.dimension_unit ? String(doc.dimension_unit).trim() : '';
    return u ? `${core} ${u}` : core;
}

async function run() {
    await mongoose.connect(process.env.MONGO_STRING, { dbName: process.env.DB_NAME });
    const db = mongoose.connection.db;
    const productsCol = db.collection('products');
    const artworksCol = db.collection('artworks');
    const typesCol = db.collection('producttypes');

    const products = await productsCol.find({}).toArray();
    const artworks = await artworksCol.find({}).toArray();
    const types = await typesCol.find({}).toArray();
    const artworkById = new Map(artworks.map((a) => [String(a._id), a]));
    const typeById = new Map(types.map((t) => [String(t._id), t]));

    let updated = 0;
    for (const p of products) {
        const art = p.artwork_id ? artworkById.get(String(p.artwork_id)) : null;
        const typ = p.product_type_id ? typeById.get(String(p.product_type_id)) : null;

        const title = art?.title || p.title || p.slug || 'Untitled';
        const description = art?.description ?? p.description ?? '';
        const format = typ?.name ?? p.format ?? null;
        const year_created = art?.year_created ?? p.year_created ?? null;
        const size_label = formatLabelFromDims(p) ?? p.size_label ?? null;

        const $set = {
            title: String(title).trim(),
            description: String(description).trim(),
            slug: p.slug,
            price_cents: p.price_cents,
            currency: p.currency || 'usd',
            quantity_available:
                p.quantity_available != null
                    ? p.quantity_available
                    : p.quantity_total != null
                      ? p.quantity_total
                      : 0,
            size_label,
            format: format ? String(format).trim() : null,
            year_created,
            stripe_product_id: p.stripe_product_id ?? null,
            stripe_price_id: p.stripe_price_id ?? null,
            is_active: p.is_active !== false,
            deleted_at: p.deleted_at ?? null
        };

        const $unset = {
            artwork_id: '',
            product_type_id: '',
            quantity_total: '',
            width: '',
            height: '',
            depth: '',
            dimension_unit: ''
        };

        await productsCol.updateOne({ _id: p._id }, { $set, $unset });
        updated += 1;
        console.log('Updated', p.slug, '→', $set.title);
    }

    console.log(`Done. Updated ${updated} products.`);
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
