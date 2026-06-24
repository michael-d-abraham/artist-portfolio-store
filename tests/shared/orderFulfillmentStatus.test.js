const {
    FULFILLMENT_STATUSES,
    FULFILLMENT_STATUS_LABELS,
    isValidFulfillmentStatus
} = require('../../shared/orderFulfillmentStatus');

describe('shared/orderFulfillmentStatus', () => {
    it('exports the expected status list', () => {
        expect(FULFILLMENT_STATUSES).toEqual([
            'new_order',
            'shipped',
            'completed',
            'cancelled'
        ]);
    });

    it('exports labels for every status', () => {
        for (const status of FULFILLMENT_STATUSES) {
            expect(typeof FULFILLMENT_STATUS_LABELS[status]).toBe('string');
            expect(FULFILLMENT_STATUS_LABELS[status].length).toBeGreaterThan(0);
        }
    });

    it('isValidFulfillmentStatus accepts known statuses', () => {
        for (const status of FULFILLMENT_STATUSES) {
            expect(isValidFulfillmentStatus(status)).toBe(true);
        }
    });

    it('isValidFulfillmentStatus rejects unknown values', () => {
        expect(isValidFulfillmentStatus('pending')).toBe(false);
        expect(isValidFulfillmentStatus('')).toBe(false);
        expect(isValidFulfillmentStatus(null)).toBe(false);
        expect(isValidFulfillmentStatus(undefined)).toBe(false);
    });
});
