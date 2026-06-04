const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            default: null
        },
        product_title: { type: String, required: true },
        product_slug: { type: String, required: true },
        image_url: { type: String, default: null },
        size_label: { type: String, default: null },
        unit_price_cents: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        line_total_cents: { type: Number, required: true },
        stripe_description: { type: String, default: null },
        stripe_unit_amount_cents: { type: Number, default: null },
        stripe_line_total_cents: { type: Number, default: null }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'order_items'
    }
);

orderItemSchema.index({ order_id: 1 });

module.exports = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema);
