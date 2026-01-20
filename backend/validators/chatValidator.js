import { body } from 'express-validator';

// Validator for creating a chat
export const createChatValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format')
];

// Validator for sending a message
export const sendMessageValidator = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('attachments.*.type')
    .optional()
    .isIn(['image', 'file'])
    .withMessage('Attachment type must be image or file'),
  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Attachment URL must be valid'),
  body('attachments.*.filename')
    .optional()
    .isString()
    .withMessage('Attachment filename must be a string'),
  body('attachments.*.size')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Attachment size must be a positive integer')
];

