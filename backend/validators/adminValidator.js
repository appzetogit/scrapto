import { body, param, query } from 'express-validator';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

// User Management Validators
export const userIdValidator = [
  param('id').isMongoId().withMessage('Invalid user ID')
];

export const updateUserValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().trim().isLength({ min: 10, max: 15 }).withMessage('Invalid phone number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim(),
  body('address.coordinates.lat').optional().isFloat().withMessage('Invalid latitude'),
  body('address.coordinates.lng').optional().isFloat().withMessage('Invalid longitude')
];

export const blockUserValidator = [
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Scrapper Management Validators
export const scrapperIdValidator = [
  param('id').isMongoId().withMessage('Invalid scrapper ID')
];

export const updateScrapperValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().trim().isLength({ min: 10, max: 15 }).withMessage('Invalid phone number'),
  body('status').optional().isIn(['active', 'blocked', 'suspended']).withMessage('Invalid status'),
  body('vehicleInfo').optional().isObject().withMessage('Vehicle info must be an object'),
  body('vehicleInfo.type').optional().isIn(['bike', 'auto', 'truck']).withMessage('Invalid vehicle type'),
  body('vehicleInfo.number').optional().trim(),
  body('vehicleInfo.capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be a positive integer'),
  body('address').optional().isObject().withMessage('Address must be an object')
];

export const updateScrapperStatusValidator = [
  body('status').isIn(['active', 'blocked', 'suspended']).withMessage('Status must be: active, blocked, or suspended')
];

// Order Management Validators
export const orderIdValidator = [
  param('id').isMongoId().withMessage('Invalid order ID')
];

export const updateOrderValidator = [
  body('status').optional().isIn(Object.values(ORDER_STATUS)).withMessage('Invalid order status'),
  body('paymentStatus').optional().isIn(Object.values(PAYMENT_STATUS)).withMessage('Invalid payment status'),
  body('scrapper').optional().isMongoId().withMessage('Invalid scrapper ID'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('scrapItems').optional().isArray().withMessage('Scrap items must be an array')
];

export const assignOrderValidator = [
  body('scrapperId').isMongoId().withMessage('Scrapper ID is required and must be valid')
];

export const cancelOrderValidator = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

// Price Feed Management Validators
export const priceIdValidator = [
  param('id').isMongoId().withMessage('Invalid price ID')
];

export const createPriceValidator = [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('pricePerKg').isFloat({ min: 0 }).withMessage('Price per kg must be a positive number'),
  body('regionCode').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Invalid region code'),
  body('effectiveDate').optional().isISO8601().withMessage('Invalid date format'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

export const updatePriceValidator = [
  body('pricePerKg').optional().isFloat({ min: 0 }).withMessage('Price per kg must be a positive number'),
  body('effectiveDate').optional().isISO8601().withMessage('Invalid date format'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Subscription Plan Management Validators
export const planIdValidator = [
  param('id').isMongoId().withMessage('Invalid plan ID')
];

export const createPlanValidator = [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Plan name is required and cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['INR', 'USD']).withMessage('Currency must be INR or USD'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('durationType').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Duration type must be: monthly, quarterly, or yearly'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('maxPickups').optional().isInt({ min: 0 }).withMessage('Max pickups must be a non-negative integer'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isPopular').optional().isBoolean().withMessage('isPopular must be a boolean'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer')
];

export const updatePlanValidator = [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Plan name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['INR', 'USD']).withMessage('Currency must be INR or USD'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('durationType').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Duration type must be: monthly, quarterly, or yearly'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('maxPickups').optional().isInt({ min: 0 }).withMessage('Max pickups must be a non-negative integer'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isPopular').optional().isBoolean().withMessage('isPopular must be a boolean'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer')
];

// Query Validators
export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const dateRangeValidator = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];




