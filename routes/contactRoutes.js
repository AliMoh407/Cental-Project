const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { validateContact } = require('../middleware/validation');

// API contact route
router.post('/api/contact', validateContact, contactController.submitContactForm);

module.exports = router; 