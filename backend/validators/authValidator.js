import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['user', 'scrapper'])
    .withMessage('Role must be either user or scrapper')
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

export const verifyOTPValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid phone number'),
  
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  
  body('purpose')
    .optional()
    .isIn(['login', 'verification'])
    .withMessage('Purpose must be either login or verification')
];

export const resendOTPValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid phone number')
];

export const sendLoginOTPValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid phone number')
];

export const refreshTokenValidator = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('Refresh token is required')
];

