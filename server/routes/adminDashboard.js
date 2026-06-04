const express = require('express');
const { getAdminDashboardHandler } = require('../controllers/adminDashboardController');

const router = express.Router();

router.get('/', getAdminDashboardHandler);

module.exports = router;
