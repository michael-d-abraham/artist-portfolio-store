const express = require('express');
const {
    listAdminOrders,
    patchAdminOrderFulfillmentStatus
} = require('../controllers/adminOrderController');

const router = express.Router();

router.get('/', listAdminOrders);
router.patch('/:id/fulfillment-status', patchAdminOrderFulfillmentStatus);

module.exports = router;
