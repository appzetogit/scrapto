import mongoose from 'mongoose';
import { SCRAP_CATEGORIES } from '../config/constants.js';

const marketplaceRequestSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    trim: true,
    default: 'Customer'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: Object.values(SCRAP_CATEGORIES),
    required: true
  },
  images: [{
    url: String,
    publicId: String
  }],
  basePrice: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Protected Data
  fullAddress: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'bidding', 'deal_closed', 'completed', 'cancelled'],
    default: 'open'
  },
  isDataDisclosed: {
    type: Boolean,
    default: false
  },
  winnerScrapper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    default: null
  },
  dealClosedAt: {
    type: Date,
    default: null
  },
  reports: [{
    scrapperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, default: 'Spam' },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance
marketplaceRequestSchema.index({ status: 1 });
marketplaceRequestSchema.index({ 'location.city': 1 });
marketplaceRequestSchema.index({ category: 1 });

const MarketplaceRequest = mongoose.model('MarketplaceRequest', marketplaceRequestSchema);

export default MarketplaceRequest;
