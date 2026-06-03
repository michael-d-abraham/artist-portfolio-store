const express = require('express');
const { getCheckoutSessionSummaryHandler } = require('../controllers/orderController');

const router = express.Router();

router.get('/checkout-session/:sessionId', getCheckoutSessionSummaryHandler);

module.exports = router;
