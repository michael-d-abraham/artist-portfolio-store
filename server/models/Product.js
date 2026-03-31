const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    artwork_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true
    },
    product_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductType',
        required: true
    },
    slug: { type: String, required: true, unique: true },
    price_cents: { type: Number, required: true },
    quantity_total: { type: Number, required: true, default: 0 },
    quantity_available: { type: Number, required: true, default: 0 },
    size_label: { type: String, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    depth: { type: Number, default: null },
    dimension_unit: { type: String, default: null },
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
