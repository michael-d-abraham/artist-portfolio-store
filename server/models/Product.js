const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true, default: '' },
    price_cents: { type: Number, required: true },
    currency: { type: String, required: true, default: 'usd' },
    quantity_available: { type: Number, required: true, default: 0 },
    size_label: { type: String, default: null },
    format: { type: String, default: null },
    year_created: { type: Number, default: null },
    stripe_product_id: { type: String, default: null },
    stripe_price_id: { type: String, default: null },
    is_active: { type: Boolean, required: true, default: true },
    deleted_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'products',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productSchema.virtual('product_images', {
    ref: 'ProductImage',
    localField: '_id',
    foreignField: 'product_id',
    options: {
        sort: { sort_order: 1, created_at: 1 },
        match: { deleted_at: null }
    }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
