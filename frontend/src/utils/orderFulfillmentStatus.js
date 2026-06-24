import {
    FULFILLMENT_STATUSES,
    FULFILLMENT_STATUS_LABELS
} from '@shared/orderFulfillmentStatus.js';

export const FULFILLMENT_STATUS_OPTIONS = FULFILLMENT_STATUSES.map((value) => ({
    value,
    label: FULFILLMENT_STATUS_LABELS[value]
}));

export { FULFILLMENT_STATUS_LABELS };

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
