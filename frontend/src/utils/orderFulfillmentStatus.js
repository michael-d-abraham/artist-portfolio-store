export const FULFILLMENT_STATUS_OPTIONS = [
    { value: 'new_order', label: 'New Order' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
];

export const FULFILLMENT_STATUS_LABELS = Object.fromEntries(
    FULFILLMENT_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export function isNewOrder(status) {
    return status === 'new_order';
}

export function fulfillmentStatusClass(value) {
    switch (value) {
        case 'new_order':
            return 'admin-status-select--new';
        case 'shipped':
            return 'admin-status-select--shipped';
        case 'completed':
            return 'admin-status-select--completed';
        case 'cancelled':
            return 'admin-status-select--cancelled';
        default:
            return 'admin-status-select--shipped';
    }
}
