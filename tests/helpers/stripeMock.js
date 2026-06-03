const mockSessionsCreate = jest.fn();
const mockSessionsRetrieve = jest.fn();
const mockListLineItems = jest.fn();
const mockConstructEvent = jest.fn();

function createMockStripeClient() {
    return {
        checkout: {
            sessions: {
                create: mockSessionsCreate,
                retrieve: mockSessionsRetrieve,
                listLineItems: mockListLineItems
            }
        },
        webhooks: {
            constructEvent: mockConstructEvent
        }
    };
}

function resetStripeMocks() {
    mockSessionsCreate.mockReset();
    mockSessionsRetrieve.mockReset();
    mockListLineItems.mockReset();
    mockConstructEvent.mockReset();
}

function defaultSuccessfulSessionCreate() {
    mockSessionsCreate.mockImplementation(async () => ({
        id: 'cs_test_jestsession0000000000000001',
        url: 'https://checkout.stripe.com/test-session'
    }));
}

module.exports = {
    mockSessionsCreate,
    mockSessionsRetrieve,
    mockListLineItems,
    mockConstructEvent,
    resetStripeMocks,
    defaultSuccessfulSessionCreate,
    createMockStripeClient
};
