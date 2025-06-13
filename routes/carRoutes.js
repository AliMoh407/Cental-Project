const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// Main routes
router.get('/', carController.getHomepage);
router.get('/car/:id', carController.getCarDetails);
router.get('/cars', carController.getAllCars);

// About Us page
router.get('/about', (req, res) => {
    res.render('about', { 
        currentPage: 'about',
        title: 'About Us - Cental Car Rental'
    });
});

// Contact Us page
router.get('/contact', (req, res) => {
    res.render('contact', { 
        currentPage: 'contact',
        title: 'Contact Us - Cental Car Rental'
    });
});

// API routes
router.get('/api/cars/search', carController.searchCars);
router.get('/api/cars/filter', carController.filterCars);
router.get('/api/cars/:id', carController.getCarById);
router.post('/api/cars/availability', carController.checkCarAvailability);

module.exports = router; 