import { body } from 'express-validator';

export const createPaymentOrderValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format')
];

export const verifyPaymentValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required')
    .trim(),

  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required')
    .trim(),

  body('razorpay_signature')
    .optional()
    .trim()
];

export const refundPaymentValidator = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

export const createSubscriptionPaymentValidator = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('planName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Plan name too long'),
  body('durationDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration must be between 1 and 365 days')
];

export const verifySubscriptionPaymentValidator = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required')
    .trim(),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required')
    .trim(),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
    .trim()
];

