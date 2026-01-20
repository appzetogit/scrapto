import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { generateToken } from '../utils/generateToken.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import { sendOTP, sendWelcomeSMS } from '../utils/otpService.js';
import logger from '../utils/logger.js';
import { USER_ROLES } from '../config/constants.js';

// Helper: bypass OTP sending for specific test numbers (disabled in production by default)
const isBypassEnabled = process.env.ENABLE_BYPASS_OTP !== 'false' && process.env.NODE_ENV !== 'production';
// User test numbers
const userBypassList = new Set(['9685974247', '9876543210', '9999999999', '7610416911', '6260491554']);
// Scrapper test numbers (dedicated for scrapper testing)
const scrapperBypassList = new Set(['8888888888', '7777777777', '6666666666', '5555555555']);
// Combined bypass list
const bypassList = new Set([...userBypassList, ...scrapperBypassList]);
const isBypassOtpNumber = (phone) => isBypassEnabled && bypassList.has(phone);
// Get bypass OTP for a phone number
const getBypassOtp = (phone) => {
  if (phone === '7610416911') {
    return '110211';
  } else if (scrapperBypassList.has(phone)) {
    return '123456'; // Default OTP for scrapper test numbers
  } else {
    return '123456'; // Default OTP for other test numbers
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const userRole = role || USER_ROLES.USER;

  // Check if phone number is already registered in opposite role
  if (userRole === USER_ROLES.USER) {
    // If registering as user, check if phone exists in Scrapper collection
    const scrapperExists = await Scrapper.findOne({ phone });
    if (scrapperExists) {
      return sendError(res, 'This phone number is already registered as a scrapper. Please use a different number or login as scrapper.', 400);
    }
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return sendError(res, 'User already exists with this email or phone', 400);
    }
  } else if (userRole === USER_ROLES.SCRAPPER) {
    // If registering as scrapper, check if phone exists in User collection
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return sendError(res, 'This phone number is already registered as a user. Please use a different number or login as user.', 400);
    }
    // Check if scrapper exists
    const scrapperExists = await Scrapper.findOne({ phone });
    if (scrapperExists) {
      return sendError(res, 'Scrapper already exists with this phone number', 400);
    }
  }

  // Create user (primary auth record)
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: userRole
  });

  // If registering as scrapper, also create scrapper profile (if not already created)
  if (userRole === USER_ROLES.SCRAPPER) {
    try {
      // Basic default vehicle info - can be updated later via profile
      const defaultVehicleInfo = {
        type: 'bike',
        number: 'NA',
        capacity: 0
      };

      await Scrapper.create({
        _id: user._id, // keep scrapper id in sync with user id
        phone,
        name,
        email,
        vehicleInfo: defaultVehicleInfo
      });
    } catch (scrapperError) {
      // If scrapper creation fails, log error but don't block registration
      logger.error('❌ Failed to create scrapper profile during registration:', {
        error: scrapperError.message,
        phone,
        userId: user._id
      });
    }
  }

  // Generate OTP for phone verification
  let otp;
  if (isBypassOtpNumber(phone)) {
    // Use custom OTP for specific phone numbers
    otp = getBypassOtp(phone);
    user.phoneVerificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  } else {
    otp = user.generateOTP();
  }
  await user.save();

  // Send OTP via SMS
  try {
    if (isBypassOtpNumber(phone)) {
      logger.info(`📵 Bypass SMS for ${phone}. Using fixed OTP ${otp}.`);
    } else {
      await sendOTP(phone, otp);
      logger.info(`📱 OTP sent successfully to ${phone}`);
    }
  } catch (smsError) {
    logger.error('SMS sending failed:', smsError.message);
    // In development mode, allow registration even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ SMS failed but allowing registration in development mode. OTP: ${otp}`);
    } else {
      // In production, return error if SMS fails
      return sendError(res, 'Failed to send OTP. Please try again.', 500);
    }
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  sendSuccess(res, 'User registered successfully. Please verify your phone number with OTP.', {
    user,
    token,
    otpSent: true
  }, 201);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is deactivated', 403);
  }

  // For admin users, ensure they use password-based login (not OTP)
  if (user.role === USER_ROLES.ADMIN) {
    if (!password) {
      return sendError(res, 'Admin users must use password-based login', 400);
    }
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  sendSuccess(res, 'Login successful', {
    user,
    token
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  sendSuccess(res, 'User retrieved successfully', { user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name,
      phone,
      address
    },
    {
      new: true,
      runValidators: true
    }
  );

  sendSuccess(res, 'Profile updated successfully', { user });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, purpose, role } = req.body;
  const requestedRole = role || (purpose === 'login' ? USER_ROLES.USER : null);

  // If role is specified, check cross-role validation
  if (requestedRole) {
    if (requestedRole === USER_ROLES.USER) {
      const scrapperExists = await Scrapper.findOne({ phone });
      if (scrapperExists) {
        return sendError(res, 'This phone number is registered as a scrapper. Please login from the scrapper portal.', 400);
      }
    } else if (requestedRole === USER_ROLES.SCRAPPER) {
      const userExists = await User.findOne({ phone, role: USER_ROLES.USER });
      if (userExists) {
        return sendError(res, 'This phone number is registered as a user. Please login from the user portal.', 400);
      }
    }
  }

  // Find user by phone, but if role is specified, also filter by role
  let user;
  if (requestedRole) {
    // First try to find with exact role match
    user = await User.findOne({ phone, role: requestedRole });

    // If not found with role, try without role (for existing users who might have wrong role)
    if (!user) {
      user = await User.findOne({ phone });
      if (user && user.role !== requestedRole) {
        logger.warn('⚠️ User found but role mismatch. Updating role:', {
          phone,
          currentRole: user.role,
          requestedRole,
          userId: user._id
        });
        // Update user role to match requested role
        user.role = requestedRole;
        await user.save();
      }
    }
  } else {
    user = await User.findOne({ phone });
  }

  if (!user) {
    const errorMsg = requestedRole
      ? `User not found with phone ${phone} and role ${requestedRole}`
      : `User not found with phone ${phone}`;
    return sendError(res, errorMsg, 404);
  }

  // Ensure role matches (after potential update above)
  if (requestedRole && user.role !== requestedRole) {
    logger.error('❌ Role mismatch in verifyOTP after update:', {
      phone,
      requestedRole,
      userRole: user.role,
      userId: user._id
    });
    return sendError(res, `Role mismatch. Expected ${requestedRole}, but user has role ${user.role}`, 400);
  }

  // Debug logging
  logger.info('🔍 OTP Verification Debug:', {
    phone,
    providedOTP: otp,
    storedOTP: user.phoneVerificationOTP,
    otpExpiresAt: user.otpExpiresAt,
    currentTime: new Date(),
    isExpired: user.otpExpiresAt ? user.otpExpiresAt < new Date() : 'No expiry set'
  });

  // Verify OTP (allow bypass numbers without requiring a prior send step)
  let isOTPValid = false;

  // Bypass acceptance: if number is in bypass list, accept the configured code
  if (isBypassOtpNumber(phone)) {
    const expectedBypassOtp = getBypassOtp(phone);
    isOTPValid = otp === expectedBypassOtp;
    if (isOTPValid) {
      // Mark OTP as valid regardless of stored values
      user.phoneVerificationOTP = null;
      user.otpExpiresAt = null;
    }
  }

  // Fallback to stored OTP validation when not already accepted via bypass
  if (!isOTPValid) {
    isOTPValid = user.verifyOTP(otp);
  }

  if (!isOTPValid) {
    logger.warn('❌ OTP verification failed:', {
      providedOTP: otp,
      storedOTP: user.phoneVerificationOTP,
      otpExpiresAt: user.otpExpiresAt,
      currentTime: new Date()
    });
    return sendError(res, 'Invalid or expired OTP', 400);
  }

  // Mark phone as verified
  if (!user.isPhoneVerified) {
    user.isPhoneVerified = true;
    user.isVerified = true;
  }

  // CRITICAL: Update role BEFORE clearing OTP and saving
  // This ensures role is correct in database before token generation
  if (requestedRole && user.role !== requestedRole) {
    logger.warn('⚠️ Role mismatch in verifyOTP - updating user role:', {
      phone,
      requestedRole,
      currentUserRole: user.role,
      userId: user._id
    });
    user.role = requestedRole;
  }

  // Clear OTP
  user.phoneVerificationOTP = null;
  user.otpExpiresAt = null;
  await user.save();

  // Always issue a fresh access token after successful verification
  // Use user.role which should now be correct (updated above if needed)
  const tokenRole = user.role;

  // Final safety check: if requestedRole was specified, ensure we use it
  if (requestedRole && tokenRole !== requestedRole) {
    logger.error('❌ CRITICAL: Role still wrong after update:', {
      phone,
      requestedRole,
      userRole: user.role,
      tokenRole,
      userId: user._id
    });
    // Force correct role
    const finalRole = requestedRole;
    const token = generateToken(user._id, finalRole);
    user.role = finalRole; // Update for response
    sendSuccess(res, 'OTP verified successfully', {
      user,
      token
    });
    return;
  }

  const token = generateToken(user._id, tokenRole);

  // Log token generation for debugging
  logger.info('🔑 Token generated in verifyOTP:', {
    userId: user._id,
    phone,
    role: tokenRole,
    requestedRole: requestedRole || 'none',
    userRoleInDB: user.role
  });

  sendSuccess(res, 'OTP verified successfully', {
    user,
    token
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Generate new OTP
  let otp;
  if (isBypassOtpNumber(phone)) {
    // Use custom OTP for specific phone numbers
    otp = getBypassOtp(phone);
    user.phoneVerificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`🔧 Bypass OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  } else {
    otp = user.generateOTP();
    logger.info(`🔧 Regular OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  }
  await user.save();

  // Send OTP via SMS
  try {
    if (isBypassOtpNumber(phone)) {
      logger.info(`📵 Bypass SMS for ${phone}. Using fixed OTP ${otp}.`);
    } else {
      await sendOTP(phone, otp);
      logger.info(`📱 OTP resent successfully to ${phone}`);
    }
  } catch (smsError) {
    logger.error('SMS sending failed:', smsError.message);
    // In development mode, allow resend even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ SMS failed but allowing resend in development mode. OTP: ${otp}`);
    } else {
      return sendError(res, 'Failed to send OTP. Please try again.', 500);
    }
  }

  sendSuccess(res, 'OTP resent successfully', {
    otpSent: true,
    ...(process.env.NODE_ENV === 'development' && { otp }) // Only send OTP in development
  });
});

// @desc    Send OTP for passwordless login
// @route   POST /api/auth/login-otp
// @access  Public
export const sendLoginOTP = asyncHandler(async (req, res) => {
  const { phone, role } = req.body;
  const requestedRole = role || USER_ROLES.USER;

  // Check if phone exists in opposite role and prevent cross-login
  if (requestedRole === USER_ROLES.USER) {
    const scrapperExists = await Scrapper.findOne({ phone });
    if (scrapperExists) {
      return sendError(res, 'This phone number is registered as a scrapper. Please login from the scrapper portal.', 400);
    }
  } else if (requestedRole === USER_ROLES.SCRAPPER) {
    const userExists = await User.findOne({ phone, role: USER_ROLES.USER });
    if (userExists) {
      return sendError(res, 'This phone number is registered as a user. Please login from the user portal.', 400);
    }
  }

  const user = await User.findOne({ phone, role: requestedRole });

  if (!user) {
    return sendError(res, 'User not found with this phone number', 404);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is deactivated. Please contact support.', 401);
  }

  // Generate new OTP
  let otp;
  if (isBypassOtpNumber(phone)) {
    // Use custom OTP for specific phone numbers
    otp = getBypassOtp(phone);
    user.phoneVerificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`🔧 Bypass OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  } else {
    otp = user.generateOTP();
    logger.info(`🔧 Regular OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  }
  await user.save();

  // Send OTP via SMS
  try {
    if (isBypassOtpNumber(phone)) {
      logger.info(`📵 Bypass SMS for ${phone}. Using fixed OTP ${otp}.`);
    } else {
      await sendOTP(phone, otp);
      logger.info(`📱 Login OTP sent successfully to ${phone}`);
    }
  } catch (smsError) {
    logger.error('SMS sending failed:', smsError.message);
    // In development mode, allow login OTP even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ SMS failed but allowing login OTP in development mode. OTP: ${otp}`);
    } else {
      return sendError(res, 'Failed to send OTP. Please try again.', 500);
    }
  }

  sendSuccess(res, 'Login OTP sent successfully', {
    otpSent: true,
    ...(process.env.NODE_ENV === 'development' && { otp }) // Only send OTP in development
  });
});

// @desc    Refresh JWT token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return sendError(res, 'Refresh token is required', 400);
  }

  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      return sendError(res, 'Server configuration error', 500);
    }

    // Verify refresh token (stateless, Redis disabled)
    const decoded = jwt.default.verify(token, secret);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id, user.role);

    // Optional rotation without persistence
    const rotateRefreshToken = process.env.ROTATE_REFRESH_TOKEN !== 'false';
    let newRefreshToken = null;

    if (rotateRefreshToken) {
      const { generateRefreshToken } = await import('../utils/generateToken.js');
      newRefreshToken = generateRefreshToken(user._id);
    }

    sendSuccess(res, 'Token refreshed successfully', {
      token: newAccessToken,
      ...(newRefreshToken && { refreshToken: newRefreshToken })
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }
    logger.error('Refresh token error:', error);
    return sendError(res, 'Failed to refresh token', 500);
  }
});

