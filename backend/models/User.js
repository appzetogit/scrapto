import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verificationToken: String,
  verificationExpire: Date,
  phoneVerificationOTP: String,
  otpExpiresAt: Date,
  isPhoneVerified: {
    type: Boolean,
    default: false
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
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    beneficiaryName: String,
    bankName: String,
    fundAccountId: String, // Razorpay Fund Account ID
    contactId: String // Razorpay Contact ID
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP for phone verification
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationOTP = otp;
  this.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (otp) {
  if (!this.phoneVerificationOTP || !this.otpExpiresAt) {
    return false;
  }

  if (this.otpExpiresAt < new Date()) {
    return false;
  }

  return this.phoneVerificationOTP === otp;
};

// Remove password and sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.phoneVerificationOTP;
  delete obj.resetPasswordToken;
  delete obj.verificationToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

