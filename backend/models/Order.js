import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS, SCRAP_CATEGORIES, ORDER_TYPES } from '../config/constants.js';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scrapper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    default: null
  },
  orderType: {
    type: String,
    enum: Object.values(ORDER_TYPES),
    default: ORDER_TYPES.SCRAP_SELL,
    index: true
  },
  serviceDetails: {
    serviceType: String,
    description: String
  },
  serviceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    default: null
  },
  scrapItems: [{
    category: {
      type: String,
      enum: Object.values(SCRAP_CATEGORIES),
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalWeight: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  preferredTime: {
    type: String,
    default: null
  },
  pickupSlot: {
    dayName: String,
    date: String,
    slot: String,
    timestamp: Number
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  assignmentStatus: {
    type: String,
    enum: ['unassigned', 'assigned', 'accepted', 'rejected'],
    default: 'unassigned'
  },
  assignmentHistory: [{
    scrapper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    status: String,
    timeoutAt: Date
  }],
  images: [{
    url: String,
    publicId: String
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ scrapper: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderType: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

