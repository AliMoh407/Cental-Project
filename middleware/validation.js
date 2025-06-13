/**
 * Validation middleware for the car rental website
 */

// Car validation
exports.validateCar = (req, res, next) => {
  const { brand, model, year, price, image, description, features } = req.body;
  const errors = {};

  // Brand validation
  if (!brand || brand.trim() === '') {
    errors.brand = 'Brand is required';
  } else if (brand.length > 50) {
    errors.brand = 'Brand name cannot exceed 50 characters';
  }

  // Model validation
  if (!model || model.trim() === '') {
    errors.model = 'Model is required';
  } else if (model.length > 50) {
    errors.model = 'Model name cannot exceed 50 characters';
  }

  // Year validation
  const currentYear = new Date().getFullYear();
  if (!year) {
    errors.year = 'Year is required';
  } else {
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }
  }

  // Price validation
  if (!price) {
    errors.price = 'Price is required';
  } else {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a positive number';
    } else if (priceNum > 1000000) {
      errors.price = 'Price cannot exceed 1,000,000';
    }
  }

  // Image validation is now handled by uploadCarImage middleware
  // No longer validating image URL since we use file uploads

  // Description validation
  if (!description || description.trim() === '') {
    errors.description = 'Description is required';
  } else if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters long';
  } else if (description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // If there are validation errors
  if (Object.keys(errors).length > 0) {
    // For add car
    if (req.path === '/cars' && req.method === 'POST') {
      return res.status(400).render('admin/add-car', {
        title: 'Add New Car - Car Rental',
        currentPage: 'admin',
        errors,
        formData: req.body,
        error: null
      });
    }
    // For edit car
    else if (req.path.includes('/cars/edit/') && req.method === 'POST') {
      const carId = req.params.id;
      const Car = require('../models/Car');
      
      return Car.findById(carId)
        .then(car => {
          if (!car) {
            return res.status(404).send('Car not found');
          }
          return res.status(400).render('admin/edit-car', {
            title: 'Edit Car - Car Rental',
            currentPage: 'admin',
            car,
            errors,
            formData: req.body,
            error: null
          });
        })
        .catch(error => {
          console.error('Error finding car:', error);
          return res.status(500).send('Error loading car details');
        });
    }
  }

  next();
};

// Booking validation
exports.validateBooking = (req, res, next) => {
  const { carId, pickupDate, returnDate, pickupLocation } = req.body;
  const errors = {};

  // Car ID validation
  if (!carId) {
    errors.carId = 'Car selection is required';
  }

  // Pickup date validation
  if (!pickupDate) {
    errors.pickupDate = 'Pickup date is required';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickup = new Date(pickupDate);
    
    if (isNaN(pickup.getTime())) {
      errors.pickupDate = 'Invalid pickup date format';
    } else if (pickup < today) {
      errors.pickupDate = 'Pickup date cannot be in the past';
    }
  }

  // Return date validation
  if (!returnDate) {
    errors.returnDate = 'Return date is required';
  } else {
    const pickup = new Date(pickupDate);
    const return_ = new Date(returnDate);
    
    if (isNaN(return_.getTime())) {
      errors.returnDate = 'Invalid return date format';
    } else if (pickupDate && return_ <= pickup) {
      errors.returnDate = 'Return date must be after pickup date';
    } else if (pickupDate) {
      const maxRental = new Date(pickup);
      maxRental.setDate(maxRental.getDate() + 30); // Max 30 days rental
      
      if (return_ > maxRental) {
        errors.returnDate = 'Maximum rental period is 30 days';
      }
    }
  }

  // Location validation
  if (!pickupLocation || pickupLocation.trim() === '') {
    errors.pickupLocation = 'Please select a pickup location';
  } else {
    // Valid pickup locations
    const validLocations = [
      'Nasr City',
      'Heliopolis',
      'New Cairo',
      'Downtown',
      'Sheikh Zayed'
    ];
    
    if (!validLocations.includes(pickupLocation)) {
      errors.pickupLocation = 'Please select a valid pickup location';
    }
  }

  // If there are validation errors
  if (Object.keys(errors).length > 0) {
    // For API request
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({ errors });
    }
    
    // For form submission
    return res.status(400).send(Object.values(errors).join('<br>'));
  }

  next();
};

// User validation for registration
exports.validateUser = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = {};

  // Name validation
  if (!name || name.trim() === '') {
    errors.name = 'Name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  } else if (password.length > 100) {
    errors.password = 'Password cannot exceed 100 characters';
  } else if (!/\d/.test(password)) {
    errors.password = 'Password must include at least one number';
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // If there are validation errors
  if (Object.keys(errors).length > 0) {
    return res.render('auth/signup', {
      title: 'Sign Up - Car Rental',
      currentPage: 'signup',
      errors,
      formData: { name, email },
      error: null
    });
  }

  next();
};

// Login validation
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  // Email validation
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  }

  // Password validation
  if (!password) {
    errors.password = 'Password is required';
  }

  // If there are validation errors
  if (Object.keys(errors).length > 0) {
    return res.render('auth/login', {
      title: 'Login - Car Rental',
      currentPage: 'login',
      errors,
      email,
      error: null
    });
  }

  next();
};

// Contact form validation
exports.validateContact = (req, res, next) => {
  const { name, email, subject, message } = req.body;
  const errors = {};

  // Name validation
  if (!name || name.trim() === '') {
    errors.name = 'Name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Subject validation
  if (!subject || subject.trim() === '') {
    errors.subject = 'Subject is required';
  } else if (subject.length < 3) {
    errors.subject = 'Subject must be at least 3 characters long';
  } else if (subject.length > 100) {
    errors.subject = 'Subject cannot exceed 100 characters';
  }

  // Message validation
  if (!message || message.trim() === '') {
    errors.message = 'Message is required';
  } else if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  } else if (message.length > 1000) {
    errors.message = 'Message cannot exceed 1000 characters';
  }

  // If there are validation errors
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// ID Picture validation for payment
exports.validateIdPicture = (req, res, next) => {
  const errors = {};

  // Check if file exists
  if (!req.file) {
    errors.idPicture = 'ID picture is required';
  } else {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      errors.idPicture = 'Only image files are allowed (JPEG, PNG, GIF)';
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      errors.idPicture = 'File size must be less than 5MB';
    }

    // Validate filename
    if (req.file.originalname.length > 255) {
      errors.idPicture = 'Filename is too long';
    }
  }

  // If there are validation errors
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Car image validation for file uploads
exports.validateCarImage = (req, res, next) => {
  // For new cars, image is required
  if (req.method === 'POST' && req.url === '/cars' && !req.file) {
    return res.status(400).render('admin/add-car', {
      title: 'Add New Car - Car Rental',
      currentPage: 'admin',
      error: 'Car image is required',
      errors: null,
      formData: req.body || {}
    });
  }

  // If file is provided, validate it
  if (req.file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      const error = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.';
      
      if (req.method === 'POST' && req.url === '/cars') {
        return res.status(400).render('admin/add-car', {
          title: 'Add New Car - Car Rental',
          currentPage: 'admin',
          error,
          errors: null,
          formData: req.body || {}
        });
      } else {
        // For edit requests, get the car info
        const Car = require('../models/Car');
        return Car.findById(req.params.id)
          .then(car => {
            return res.status(400).render('admin/edit-car', {
              title: 'Edit Car - Car Rental',
              currentPage: 'admin',
              error,
              errors: null,
              formData: req.body || {},
              car: car
            });
          })
          .catch(err => {
            console.error('Error finding car:', err);
            return res.status(500).send('Error validating car image');
          });
      }
    }

    // Validate file size (5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      const error = 'File too large. Maximum size is 5MB.';
      
      if (req.method === 'POST' && req.url === '/cars') {
        return res.status(400).render('admin/add-car', {
          title: 'Add New Car - Car Rental',
          currentPage: 'admin',
          error,
          errors: null,
          formData: req.body || {}
        });
      } else {
        // For edit requests, get the car info
        const Car = require('../models/Car');
        return Car.findById(req.params.id)
          .then(car => {
            return res.status(400).render('admin/edit-car', {
              title: 'Edit Car - Car Rental',
              currentPage: 'admin',
              error,
              errors: null,
              formData: req.body || {},
              car: car
            });
          })
          .catch(err => {
            console.error('Error finding car:', err);
            return res.status(500).send('Error validating car image');
          });
      }
    }
  }

  next();
}; 