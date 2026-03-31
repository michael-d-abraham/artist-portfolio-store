const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    features: { type: [String], default: [] },
    material: { type: String, default: null },
    is_active: { type: Boolean, required: true, default: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.models.ProductType || mongoose.model('ProductType', productTypeSchema);
