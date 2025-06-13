const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// Booking routes
router.get('/bookings', requireAuth, bookingController.getUserBookings);
router.post('/book', requireAuth, validateBooking, bookingController.createBooking);

// API booking routes
router.post('/api/bookings', requireAuth, validateBooking, bookingController.apiCreateBooking);
router.get('/api/bookings', bookingController.getAllBookings);
router.patch('/api/bookings/:id/status', bookingController.updateBookingStatus);

module.exports = router; 