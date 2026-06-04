const {
    listPaidOrdersForAdmin,
    updateOrderFulfillmentStatus
} = require('../services/adminOrdersService');
const { FULFILLMENT_STATUSES } = require('../utils/orderFulfillmentStatus');

async function listAdminOrders(req, res) {
    try {
        const orders = await listPaidOrdersForAdmin();
        return res.json({ orders, fulfillment_statuses: FULFILLMENT_STATUSES });
    } catch (err) {
        console.error('listAdminOrders', err);
        return res.status(500).json({ error: 'Unable to load orders' });
    }
}

async function patchAdminOrderFulfillmentStatus(req, res) {
    try {
        const fulfillmentStatus = req.body && req.body.fulfillment_status;
        const result = await updateOrderFulfillmentStatus(req.params.id, fulfillmentStatus);
        if (!result.ok) {
            return res.status(result.status || 400).json({ error: result.error });
        }
        return res.json({ order: result.order });
    } catch (err) {
        console.error('patchAdminOrderFulfillmentStatus', err);
        return res.status(500).json({ error: 'Unable to update order' });
    }
}

module.exports = {
    listAdminOrders,
    patchAdminOrderFulfillmentStatus
};
