const express = require('express');
const { createCheckoutSessionHandler } = require('../controllers/checkoutController');

const router = express.Router();

// REST-style path
router.post('/create-session', createCheckoutSessionHandler);
// Stripe docs sample path: POST /create-checkout-session
router.post('/create-checkout-session', createCheckoutSessionHandler);

module.exports = router;
