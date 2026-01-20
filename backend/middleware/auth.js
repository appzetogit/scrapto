import jwt from 'jsonwebtoken';
import { USER_ROLES } from '../config/constants.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Debug logging
  logger.info('🔐 Auth Middleware Debug:', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization,
    authHeaderPrefix: req.headers.authorization?.substring(0, 20),
    hasToken: !!token,
    tokenLength: token?.length
  });

  if (!token) {
    logger.warn('❌ No token provided for:', req.path);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  const secret = process.env.JWT_SECRET || 'scrapto-dev-secret-key-change-in-production-2024';
  
  // Debug logging to show which secret is being used for verification
  const secretSource = process.env.JWT_SECRET ? 'process.env.JWT_SECRET' : 'DEFAULT_JWT_SECRET';
  const secretPreview = secret.length > 20 ? `${secret.substring(0, 20)}...` : secret;
  logger.info('🔑 Verifying JWT Token:', {
    secretSource,
    secretLength: secret.length,
    secretPreview,
    tokenLength: token?.length,
    tokenPreview: token ? `${token.substring(0, 30)}...` : 'none'
  });
  
  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error. JWT_SECRET not set.'
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    logger.info('✅ Token verified successfully:', {
      userId: decoded.id,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
      isExpired: decoded.exp ? decoded.exp < Date.now() / 1000 : 'N/A'
    });
    // Attach decoded
    req.user = decoded;

    // Verify user exists in User collection (scrappers are stored in User collection with role='scrapper')
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.error('❌ User not found in database:', { userId: decoded.id, role: decoded.role });
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is active (for all roles including scrappers)
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // For scrappers, check if there's a separate Scrapper document (optional - for legacy support)
    // But don't fail if it doesn't exist since scrappers are primarily in User collection
    if (decoded.role === USER_ROLES.SCRAPPER) {
      // Scrappers are stored in User collection, so we don't need to check Scrapper collection
      // But we can optionally link to Scrapper document if it exists
      req.user.userId = user._id.toString();
    }

    next();
  } catch (error) {
    logger.error('❌ Token verification failed:', {
      error: error.message,
      errorName: error.name,
      path: req.path
    });
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Role-specific middleware
export const isUser = authorize(USER_ROLES.USER);
export const isScrapper = authorize(USER_ROLES.SCRAPPER);
export const isAdmin = authorize(USER_ROLES.ADMIN);

