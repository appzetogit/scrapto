import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../config/constants.js';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    default: null
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  entityType: {
    type: String,
    enum: ['order', 'subscription', 'price_feed', 'commission', 'withdrawal'],
    default: 'order'
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit'],
    default: 'credit'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    default: 'razorpay'
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  razorpayPaymentLinkId: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  receipt: {
    type: String,
    default: null
  },
  refundId: {
    type: String,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundedAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  planName: {
    type: String,
    default: null
  },
  durationDays: {
    type: Number,
    default: null
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ order: 1 });
paymentSchema.index({ entityId: 1, entityType: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

