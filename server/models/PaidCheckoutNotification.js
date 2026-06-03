const mongoose = require('mongoose');

const paidCheckoutNotificationSchema = new mongoose.Schema(
    {
        stripe_checkout_session_id: { type: String, required: true, unique: true }
    },
    {
        timestamps: { createdAt: 'sent_at', updatedAt: false },
        collection: 'paid_checkout_notifications'
    }
);

module.exports =
    mongoose.models.PaidCheckoutNotification ||
    mongoose.model('PaidCheckoutNotification', paidCheckoutNotificationSchema);
