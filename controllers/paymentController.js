const Cart = require('../models/Cart');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/id-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Export multer upload middleware
exports.uploadIdPicture = upload.single('idPicture');

// Display payment page
exports.getPaymentPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const cart = await Cart.findOne({ user: req.session.user.id })
      .populate('items.car')
      .exec();
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }
    
    // Calculate additional fees
    const subtotal = cart.totalAmount;
    const taxRate = 0.14; // 14% tax
    const serviceFee = 25; // Fixed service fee
    const tax = subtotal * taxRate;
    const total = subtotal + tax + serviceFee;
    
    res.render('payment/checkout', {
      title: 'Payment - Car Rental',
      currentPage: 'payment',
      cart,
      pricing: {
        subtotal,
        tax,
        serviceFee,
        total,
        taxRate: taxRate * 100
      }
    });
    
  } catch (error) {
    console.error('Payment page error:', error);
    res.status(500).send('Error loading payment page');
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { 
      cardNumber, 
      expiryMonth, 
      expiryYear, 
      cvv, 
      cardHolderName,
      paymentMethod,
      phoneNumber,
      countryCode
    } = req.body;
    
    // Check if ID picture was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload your ID picture' });
    }

    // Validate phone number fields
    if (!phoneNumber || !countryCode) {
      return res.status(400).json({ error: 'Phone number and country code are required' });
    }

    // Basic phone number validation (remove non-digits and check length)
    const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhoneNumber.length < 7 || cleanPhoneNumber.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in to complete payment' });
    }
    
    const cart = await Cart.findOne({ user: req.session.user.id })
      .populate('items.car')
      .exec();
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Calculate totals
    const subtotal = cart.totalAmount;
    const tax = subtotal * 0.14;
    const serviceFee = 25;
    const total = subtotal + tax + serviceFee;
    
    // Simulate payment processing (in real app, integrate with payment gateway)
    const isPaymentSuccessful = await simulatePaymentProcessing(cardNumber, total);
    
    if (!isPaymentSuccessful) {
      return res.status(400).json({ 
        error: 'Payment failed. Please check your card details and try again.' 
      });
    }
    
    // Create payment record
    const payment = new Payment({
      user: req.session.user.id,
      amount: total,
      subtotal,
      tax,
      serviceFee,
      paymentMethod: paymentMethod || 'credit_card',
      cardLastFour: cardNumber.slice(-4),
      status: 'completed',
      transactionId: generateTransactionId(),
      idPicture: req.file.filename,
      phoneNumber: cleanPhoneNumber,
      countryCode: countryCode
    });
    
    await payment.save();
    
    // Create bookings for each cart item
    const bookings = [];
    
    for (const item of cart.items) {
      // Check if car is still available
      if (!item.car.available) {
        return res.status(400).json({ 
          error: `${item.car.brand} ${item.car.model} is no longer available` 
        });
      }
      
      const booking = new Booking({
        user: req.session.user.id,
        car: item.car._id,
        pickupDate: item.pickupDate,
        returnDate: item.returnDate,
        pickupLocation: item.pickupLocation,
        price: item.totalPrice,
        status: 'confirmed',
        paymentId: payment._id
      });
      
      await booking.save();
      bookings.push(booking);
    }
    
    // Clear the cart after successful payment
    await Cart.findOneAndDelete({ user: req.session.user.id });
    
    res.json({ 
      success: true, 
      message: 'Payment successful! Your bookings have been confirmed.',
      bookingsCount: bookings.length,
      transactionId: payment.transactionId,
      redirectUrl: '/payment/success'
    });
    
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
};

// Payment success page
exports.getSuccessPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    // Get recent payment
    const recentPayment = await Payment.findOne({ 
      user: req.session.user.id 
    }).sort({ createdAt: -1 });
    
    // Get recent bookings
    const recentBookings = await Booking.find({ 
      user: req.session.user.id,
      paymentId: recentPayment?._id
    }).populate('car').sort({ createdAt: -1 });
    
    res.render('payment/success', {
      title: 'Payment Successful - Car Rental',
      currentPage: 'payment-success',
      payment: recentPayment,
      bookings: recentBookings
    });
    
  } catch (error) {
    console.error('Payment success page error:', error);
    res.status(500).send('Error loading success page');
  }
};

// Simulate payment processing (replace with real payment gateway)
async function simulatePaymentProcessing(cardNumber, amount) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate payment failure for testing (invalid card numbers)
  const failureCards = ['4000000000000002', '4000000000000010', '4000000000000028'];
  if (failureCards.includes(cardNumber)) {
    return false;
  }
  
  // Simulate random failure (5% chance)
  if (Math.random() < 0.05) {
    return false;
  }
  
  return true; // Payment successful
}

// Generate transaction ID
function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
} 