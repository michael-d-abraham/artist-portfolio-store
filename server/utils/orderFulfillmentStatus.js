const FULFILLMENT_STATUSES = ['new_order', 'processing', 'shipped', 'completed', 'cancelled'];

const FULFILLMENT_STATUS_LABELS = {
    new_order: 'New Order',
    processing: 'Processing',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled'
};

function isValidFulfillmentStatus(value) {
    return typeof value === 'string' && FULFILLMENT_STATUSES.includes(value);
}

module.exports = {
    FULFILLMENT_STATUSES,
    FULFILLMENT_STATUS_LABELS,
    isValidFulfillmentStatus
};
