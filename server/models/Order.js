const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        line1: { type: String, default: null },
        line2: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        postal_code: { type: String, default: null },
        country: { type: String, default: null }
    },
    { _id: false }
);

const ORDER_STATUSES = ['pending', 'paid', 'failed', 'canceled', 'refunded'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'no_payment_required', 'failed'];

const orderSchema = new mongoose.Schema(
    {
        order_number: { type: String, required: true, unique: true },
        customer_email: { type: String, default: null },
        customer_name: { type: String, default: null },
        stripe_checkout_session_id: { type: String, default: null, sparse: true, unique: true },
        stripe_payment_intent_id: { type: String, default: null, sparse: true, unique: true },
        stripe_customer_id: { type: String, default: null },
        status: { type: String, enum: ORDER_STATUSES, required: true, default: 'pending' },
        payment_status: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'unpaid' },
        subtotal_cents: { type: Number, required: true, default: 0 },
        tax_cents: { type: Number, required: true, default: 0 },
        shipping_cents: { type: Number, required: true, default: 0 },
        total_cents: { type: Number, required: true, default: 0 },
        currency: { type: String, required: true, default: 'usd' },
        shipping_address: { type: addressSchema, default: null },
        billing_address: { type: addressSchema, default: null }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'orders'
    }
);

orderSchema.index({ customer_email: 1 });
orderSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
