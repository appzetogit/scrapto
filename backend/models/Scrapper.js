import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const scrapperSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  profilePic: {
    type: String,
    default: null
  },
  vehicleInfo: {
    type: {
      type: String,
      enum: ['bike', 'auto', 'truck'],
      required: true
    },
    number: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 0
    }
  },
  kyc: {
    aadhaarNumber: {
      type: String,
      // Encrypted in application layer
      select: false
    },
    aadhaarPhotoUrl: {
      type: String,
      default: null
    },
    selfieUrl: {
      type: String,
      default: null
    },
    licenseUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'expired'
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    razorpaySubscriptionId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    }
  },
  marketSubscription: {
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'expired'
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    razorpaySubscriptionId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    }
  },
  liveLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  availableSlots: [{
    day: {
      type: Number, // 0-6 (Sunday-Saturday)
      required: true,
      min: 0,
      max: 6
    },
    timeSlots: [{
      start: {
        type: String,
        required: true
      },
      end: {
        type: String,
        required: true
      }
    }]
  }],
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  totalPickups: {
    type: Number,
    default: 0
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    withdrawn: {
      type: Number,
      default: 0
    }
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Insufficient funds']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN'],
      default: 'ACTIVE'
    }
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'suspended'],
    default: 'active'
  },
  phoneVerificationOTP: {
    type: String,
    select: false
  },
  otpExpiresAt: {
    type: Date,
    select: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
scrapperSchema.index({ liveLocation: '2dsphere' });
scrapperSchema.index({ isOnline: 1, 'kyc.status': 1, 'subscription.status': 1, 'marketSubscription.status': 1 });
scrapperSchema.index({ phone: 1 }, { unique: true });

// Hash password before saving
scrapperSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
scrapperSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP for phone verification
scrapperSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationOTP = otp;
  this.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify OTP
scrapperSchema.methods.verifyOTP = function (otp) {
  if (!this.phoneVerificationOTP || !this.otpExpiresAt) {
    return false;
  }

  if (this.otpExpiresAt < new Date()) {
    return false;
  }

  return this.phoneVerificationOTP === otp;
};

// Remove sensitive data from JSON output
scrapperSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.phoneVerificationOTP;
  if (obj.kyc) {
    delete obj.kyc.aadhaarNumber;
  }
  return obj;
};

const Scrapper = mongoose.model('Scrapper', scrapperSchema);

export default Scrapper;

