import mongoose from 'mongoose';
import { PRICE_TYPES } from '../config/constants.js';

const priceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(PRICE_TYPES),
    default: PRICE_TYPES.MATERIAL,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  pricePerKg: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  price: {
    type: Number, // Generic price field for services (Fixed Price) or alternate units
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  image: {
    type: String,
    trim: true,
    default: null
  },
  regionCode: {
    type: String,
    required: [true, 'Region code is required'],
    trim: true,
    index: true,
    default: 'IN-DL' // Default to Delhi
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
    default: Date.now,
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
priceSchema.index({ type: 1, category: 1, regionCode: 1, effectiveDate: -1, isActive: 1 });
priceSchema.index({ regionCode: 1, isActive: 1 });

// Get current active price for a category and region
priceSchema.statics.getCurrentPrice = async function (category, regionCode = 'IN-DL', type = PRICE_TYPES.MATERIAL) {
  const price = await this.findOne({
    category,
    type,
    regionCode,
    isActive: true,
    effectiveDate: { $lte: new Date() }
  }).sort({ effectiveDate: -1 });

  return price;
};

// Get all active prices for a region
priceSchema.statics.getActivePrices = async function (regionCode = 'IN-DL', type = PRICE_TYPES.MATERIAL) {
  const prices = await this.find({
    type,
    regionCode,
    isActive: true,
    effectiveDate: { $lte: new Date() }
  }).sort({ category: 1, effectiveDate: -1 });

  // Get the latest price for each category
  const priceMap = new Map();
  prices.forEach(price => {
    if (!priceMap.has(price.category)) {
      priceMap.set(price.category, price);
    }
  });

  return Array.from(priceMap.values());
};

const Price = mongoose.model('Price', priceSchema);

export default Price;

