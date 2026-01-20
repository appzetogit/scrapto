import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { USER_ROLES } from '../config/constants.js';

// Helper function to check if token belongs to admin
const isAdminToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'scrapto-dev-secret-key-change-in-production-2024';

    try {
      const decoded = jwt.verify(token, secret);
      return decoded.role === USER_ROLES.ADMIN;
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for admin users (check token directly)
  skip: (req) => {
    // Skip if it's an admin route
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/v1/admin')) {
      return true;
    }
    // Skip if token belongs to admin
    if (isAdminToken(req)) {
      return true;
    }
    return false;
  },
});

// Admin-specific rate limiter with higher limits (for extra safety)
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Admin can make 1000 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
  // Skip rate limiting for admin login attempts
  skip: (req) => {
    // Check if it's an admin login attempt (email contains admin or scrapto)
    const email = req.body?.email || '';
    if (email.includes('admin') || email.includes('scrapto')) {
      return true;
    }
    return false;
  },
});

