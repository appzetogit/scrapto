import { body } from 'express-validator';
import { SCRAP_CATEGORIES, ORDER_STATUS, ORDER_TYPES } from '../config/constants.js';

export const createOrderValidator = [
  body('scrapItems')
    .if((value, { req }) => req.body.orderType !== ORDER_TYPES.CLEANING_SERVICE)
    .isArray({ min: 1 })
    .withMessage('At least one scrap item is required')
    .custom((items) => {
      items.forEach((item, index) => {
        if (!item.category) {
          throw new Error(`Item ${index + 1}: Category is required`);
        }
        if (!Object.values(SCRAP_CATEGORIES).includes(item.category)) {
          throw new Error(`Item ${index + 1}: Invalid category`);
        }
        if (!item.weight || item.weight <= 0) {
          throw new Error(`Item ${index + 1}: Weight must be greater than 0`);
        }
        if (!item.rate || item.rate < 0) {
          throw new Error(`Item ${index + 1}: Rate must be 0 or greater`);
        }
        if (!item.total || item.total < 0) {
          throw new Error(`Item ${index + 1}: Total must be 0 or greater`);
        }
      });
      return true;
    }),

  body('pickupAddress')
    .optional()
    .isObject()
    .withMessage('Pickup address must be an object'),

  body('pickupAddress.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),

  body('pickupAddress.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('pickupAddress.pincode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be 6 digits'),

  body('pickupAddress.coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('pickupAddress.coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('preferredTime')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Preferred time cannot be empty'),

  body('pickupSlot')
    .optional()
    .isObject()
    .withMessage('Pickup slot must be an object'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const updateOrderStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(ORDER_STATUS))
    .withMessage('Invalid order status')
];

export const cancelOrderValidator = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

export const updateOrderValidator = [
  body('scrapItems')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one scrap item is required'),

  body('pickupAddress')
    .optional()
    .isObject()
    .withMessage('Pickup address must be an object'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

