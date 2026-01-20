import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

/**
 * Required environment variables
 */
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

/**
 * Optional but recommended environment variables
 */
const recommendedEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'FRONTEND_URL'
];

/**
 * Validate environment variables
 */
export const validateEnv = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check recommended variables
  recommendedEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Log missing required variables
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Log warnings for recommended variables
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    logger.warn(`⚠️  Missing recommended environment variables: ${warnings.join(', ')}`);
  }

  // Validate JWT_SECRET in production
  if (process.env.NODE_ENV === 'production') {
    const defaultSecret = 'scrapto-dev-secret-key-change-in-production-2024';
    if (process.env.JWT_SECRET === defaultSecret || !process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
  }

  logger.info('✅ Environment variables validated successfully');
};

/**
 * Get environment variable with default value
 * @param {string} key - Environment variable key
 * @param {any} defaultValue - Default value if not set
 * @returns {any} - Environment variable value or default
 */
export const getEnv = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * Check if running in production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
};

export default {
  validateEnv,
  getEnv,
  isProduction,
  isDevelopment
};

