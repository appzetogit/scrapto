import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  verifyOTP,
  resendOTP,
  sendLoginOTP,
  refreshToken
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { 
  registerValidator, 
  loginValidator,
  verifyOTPValidator,
  resendOTPValidator,
  sendLoginOTPValidator,
  refreshTokenValidator
} from '../validators/authValidator.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authRateLimiter, registerValidator, validate, register);
router.post('/login', authRateLimiter, loginValidator, validate, login);
router.post('/verify-otp', verifyOTPValidator, validate, verifyOTP);
router.post('/resend-otp', resendOTPValidator, validate, resendOTP);
router.post('/login-otp', sendLoginOTPValidator, validate, sendLoginOTP);
router.post('/refresh-token', authRateLimiter, refreshTokenValidator, validate, refreshToken);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

