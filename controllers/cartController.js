const Cart = require('../models/Cart');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { carId, pickupDate, returnDate, pickupLocation } = req.body;
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in to add items to cart' });
    }
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    if (!car.available) {
      return res.status(400).json({ error: 'Car is not available' });
    }
    
    // Calculate total days and price
    const pickup = new Date(pickupDate);
    const return_ = new Date(returnDate);
    const totalDays = Math.ceil((return_ - pickup) / (1000 * 60 * 60 * 24));
    const totalPrice = totalDays * car.price;
    
    // Find or create cart for user
    let cart = await Cart.findOne({ user: req.session.user.id });
    
    if (!cart) {
      cart = new Cart({
        user: req.session.user.id,
        items: []
      });
    }
    
    // Check if same car with same dates already in cart
    const existingItem = cart.items.find(item => 
      item.car.toString() === carId &&
      item.pickupDate.getTime() === pickup.getTime() &&
      item.returnDate.getTime() === return_.getTime()
    );
    
    if (existingItem) {
      return res.status(400).json({ error: 'This car with the same dates is already in your cart' });
    }
    
    // Add new item to cart
    cart.items.push({
      car: carId,
      pickupDate: pickup,
      returnDate: return_,
      pickupLocation,
      totalDays,
      totalPrice
    });
    
    await cart.save();
    
    res.json({ 
      success: true, 
      message: 'Car added to cart successfully',
      cartItemsCount: cart.items.length
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add car to cart' });
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const cart = await Cart.findOne({ user: req.session.user.id })
      .populate('items.car')
      .exec();
    
    res.render('cart/index', {
      title: 'Shopping Cart - Car Rental',
      currentPage: 'cart',
      cart: cart || { items: [], totalAmount: 0 }
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).send('Error loading cart');
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in' });
    }
    
    const cart = await Cart.findOne({ user: req.session.user.id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    
    res.json({ 
      success: true, 
      message: 'Item removed from cart',
      cartItemsCount: cart.items.length,
      totalAmount: cart.totalAmount
    });
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in' });
    }
    
    await Cart.findOneAndDelete({ user: req.session.user.id });
    
    res.json({ 
      success: true, 
      message: 'Cart cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// Checkout - convert cart to bookings
exports.checkout = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in to checkout' });
    }
    
    const cart = await Cart.findOne({ user: req.session.user.id })
      .populate('items.car')
      .exec();
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
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
        status: 'confirmed'
      });
      
      await booking.save();
      bookings.push(booking);
    }
    
    // Clear the cart after successful checkout
    await Cart.findOneAndDelete({ user: req.session.user.id });
    
    res.json({ 
      success: true, 
      message: 'Checkout successful! Your bookings have been confirmed.',
      bookingsCount: bookings.length
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed. Please try again.' });
  }
};

// Get cart count for header
exports.getCartCount = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ count: 0 });
    }
    
    const cart = await Cart.findOne({ user: req.session.user.id });
    const count = cart ? cart.items.length : 0;
    
    res.json({ count });
    
  } catch (error) {
    console.error('Get cart count error:', error);
    res.json({ count: 0 });
  }
}; 