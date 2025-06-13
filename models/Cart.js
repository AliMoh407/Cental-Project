const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update totalAmount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => total + item.totalPrice, 0);
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema); 