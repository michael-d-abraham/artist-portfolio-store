const FULFILLMENT_STATUSES = ['new_order', 'shipped', 'completed', 'cancelled'];

const FULFILLMENT_STATUS_LABELS = {
    new_order: 'New Order',
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
