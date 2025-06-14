const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const { validateCar, validateCarImage } = require('../middleware/validation');

// Admin dashboard
router.get('/dashboard', requireAdmin, adminController.getDashboard);

// Car management
router.get('/cars/add', requireAdmin, adminController.getAddCar);
router.post('/cars/add', requireAdmin, adminController.uploadCarImages, adminController.postAddCar);
router.get('/cars/edit/:id', requireAdmin, adminController.getEditCar);
router.post('/cars/edit/:id', requireAdmin, adminController.uploadCarImages, adminController.postEditCar);
router.delete('/cars/:id', requireAdmin, adminController.deleteCar);
router.post('/cars/:id/availability', requireAdmin, adminController.toggleCarAvailability);

// Booking management
router.post('/bookings/:id/status', requireAdmin, adminController.updateBookingStatus);
router.delete('/bookings/:id', requireAdmin, adminController.deleteBooking);

module.exports = router; 