import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD'],
    uppercase: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  durationType: {
    type: String,
    required: [true, 'Duration type is required'],
    enum: ['monthly', 'quarterly', 'yearly'],
    lowercase: true
  },
  features: [{
    type: String,
    trim: true
  }],
  maxPickups: {
    type: Number,
    default: null, // null = unlimited
    min: [0, 'Max pickups cannot be negative']
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['general', 'market_price'],
    default: 'general',
    required: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ durationType: 1, isActive: 1 });

// Static method to get active plans
subscriptionPlanSchema.statics.getActivePlans = async function () {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, priority: -1, createdAt: 1 });
};

// Static method to get plan by ID (only if active)
subscriptionPlanSchema.statics.getActivePlanById = async function (planId) {
  return this.findOne({ _id: planId, isActive: true });
};

// Instance method to calculate duration in days
subscriptionPlanSchema.methods.getDurationInDays = function () {
  if (this.durationType === 'monthly') {
    return this.duration * 30;
  } else if (this.durationType === 'quarterly') {
    return this.duration * 90;
  } else if (this.durationType === 'yearly') {
    return this.duration * 365;
  }
  return this.duration; // fallback to days
};

// Remove sensitive/internal fields from JSON output
subscriptionPlanSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // All fields are safe to expose, but we can add filtering here if needed
  return obj;
};

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;





