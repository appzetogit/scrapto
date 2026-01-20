import smsIndiaHubService from '../services/smsIndiaHubService.js';
import logger from './logger.js';

// In-memory store for OTPs (replacing Redis)
const otpStore = new Map();

/**
 * Store OTP in memory
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>}
 */
const storeOTP = async (phone, otp, ttl = 600) => {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + ttl * 1000
  });

  // Set timeout to cleanup
  setTimeout(() => {
    const data = otpStore.get(phone);
    if (data && data.expiresAt <= Date.now()) {
      otpStore.delete(phone);
    }
  }, ttl * 1000);

  return true;
};

/**
 * Get OTP from memory
 * @param {string} phone - Phone number
 * @returns {Promise<string|null>}
 */
const getOTP = async (phone) => {
  const data = otpStore.get(phone);
  if (!data) return null;

  if (data.expiresAt <= Date.now()) {
    otpStore.delete(phone);
    return null;
  }

  return data.otp;
};

/**
 * Delete OTP from memory
 * @param {string} phone - Phone number
 * @returns {Promise<boolean>}
 */
const deleteOTP = async (phone) => {
  return otpStore.delete(phone);
};

/**
 * Send OTP via SMS using SMSIndia Hub and store in Redis
 * @param {string} phone - Phone number to send SMS to
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} - Response object
 */
export const sendOTP = async (phone, otp) => {
  try {
    logger.info(`Attempting to send OTP ${otp} to phone: ${phone}`);

    // Store OTP in Redis (10 minutes TTL)
    const stored = await storeOTP(phone, otp, 600);
    if (!stored) {
      logger.warn('Failed to store OTP in Redis, continuing with SMS');
    }

    const result = await smsIndiaHubService.sendOTP(phone, otp);

    logger.info(`SMS sent successfully via SMSIndia Hub:`, result);
    return result;

  } catch (error) {
    logger.error('Failed to send OTP via SMSIndia Hub:', error.message);

    // Re-throw the error to be handled by the calling function
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

/**
 * Verify OTP from Redis or database
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} - True if OTP is valid
 */
export const verifyOTPFromRedis = async (phone, otp) => {
  try {
    // Try Redis first
    const storedOTP = await getOTP(phone);
    if (storedOTP && storedOTP === otp) {
      // Delete OTP after successful verification
      await deleteOTP(phone);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error verifying OTP from Redis:', error);
    return false;
  }
};

/**
 * Send welcome SMS to new users
 * @param {string} phone - Phone number
 * @param {string} name - User's name
 * @returns {Promise}
 */
export const sendWelcomeSMS = async (phone, name) => {
  try {
    const message = `Welcome to Scrapto, ${name}! Your account has been successfully created. Start managing your scrap orders and connect with verified scrappers.`;
    return await smsIndiaHubService.sendCustomSMS(phone, message);
  } catch (error) {
    logger.error('Error sending welcome SMS:', error);
    throw error;
  }
};

/**
 * Send order confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} orderId - Order ID
 * @param {number} amount - Order amount
 * @returns {Promise}
 */
export const sendOrderConfirmationSMS = async (phone, orderId, amount) => {
  try {
    const message = `Your scrap order #${orderId} has been confirmed. Total amount: ₹${amount}. Our scrapper will contact you soon for pickup.`;
    return await smsIndiaHubService.sendCustomSMS(phone, message);
  } catch (error) {
    logger.error('Error sending order confirmation SMS:', error);
    throw error;
  }
};

/**
 * Send password reset OTP SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise}
 */
export const sendPasswordResetOTP = async (phone, otp) => {
  try {
    const message = `Your Scrapto password reset OTP is ${otp}. This OTP is valid for 10 minutes. Do not share it with anyone.`;
    return await smsIndiaHubService.sendCustomSMS(phone, message);
  } catch (error) {
    logger.error('Error sending password reset OTP SMS:', error);
    throw error;
  }
};

/**
 * Get SMSIndia Hub account balance
 * @returns {Promise<Object>} - Balance information
 */
export const getSMSBalance = async () => {
  try {
    return await smsIndiaHubService.getBalance();
  } catch (error) {
    logger.error('Error fetching SMS balance:', error);
    throw error;
  }
};

/**
 * Test SMSIndia Hub connection
 * @returns {Promise<Object>} - Test result
 */
export const testSMSConnection = async () => {
  try {
    return await smsIndiaHubService.testConnection();
  } catch (error) {
    logger.error('Error testing SMS connection:', error);
    throw error;
  }
};

