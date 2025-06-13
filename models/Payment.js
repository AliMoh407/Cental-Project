const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  serviceFee: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    default: 'credit_card'
  },
  cardLastFour: {
    type: String,
    required: function() {
      return this.paymentMethod === 'credit_card' || this.paymentMethod === 'debit_card';
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  gateway: {
    type: String,
    default: 'stripe' // In real app, could be stripe, paypal, etc.
  },
  gatewayTransactionId: {
    type: String
  },
  failureReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  idPicture: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  countryCode: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
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

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema); 