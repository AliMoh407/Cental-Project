const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { validateUser, validateLogin } = require('../middleware/validation');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).render('auth/login', {
      title: 'Login - Car Rental',
      currentPage: 'login',
      error: 'Too many login attempts. Please try again after 15 minutes.',
      errors: null,
      email: req.body.email || ''
    });
  }
});

// Rate limiting for signup attempts  
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 signup requests per hour
  message: {
    error: 'Too many accounts created from this IP, please try again after an hour.'
  },
  handler: (req, res) => {
    res.status(429).render('auth/signup', {
      title: 'Sign Up - Car Rental',
      currentPage: 'signup',
      error: 'Too many signup attempts. Please try again after an hour.',
      errors: null,
      formData: null
    });
  }
});

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', loginLimiter, validateLogin, authController.postLogin);

// Logout route
router.get('/logout', authController.logout);

// Signup routes
router.get('/signup', authController.getSignup);
router.post('/signup', signupLimiter, validateUser, authController.postSignup);

module.exports = router; 