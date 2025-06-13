const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');
const { validateIdPicture } = require('../middleware/validation');

// All payment routes require authentication
router.use(requireAuth);

// GET /payment/checkout - Display payment page
router.get('/checkout', paymentController.getPaymentPage);

// POST /payment/process - Process payment (with file upload)
router.post('/process', paymentController.uploadIdPicture, validateIdPicture, paymentController.processPayment);

// GET /payment/success - Payment success page
router.get('/success', paymentController.getSuccessPage);

module.exports = router; 