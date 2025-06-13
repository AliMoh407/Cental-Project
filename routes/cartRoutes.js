const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// All cart routes require authentication
router.use(requireAuth);

// GET /cart - View cart
router.get('/', cartController.getCart);

// POST /cart/add - Add item to cart
router.post('/add', validateBooking, cartController.addToCart);

// DELETE /cart/remove/:itemId - Remove item from cart
router.delete('/remove/:itemId', cartController.removeFromCart);

// DELETE /cart/clear - Clear entire cart
router.delete('/clear', cartController.clearCart);

// POST /cart/checkout - Checkout cart
router.post('/checkout', cartController.checkout);

// GET /cart/count - Get cart item count
router.get('/count', cartController.getCartCount);

module.exports = router; 