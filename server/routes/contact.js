const express = require('express');
const { postContactFormHandler } = require('../controllers/contactFormController');

const router = express.Router();

router.post('/', postContactFormHandler);

module.exports = router;
