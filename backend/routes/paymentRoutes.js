import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPayment,
  getMyPayments,
  refundPaymentAmount,
  getPaymentStatus,
  createSubscriptionPaymentOrder,
  verifySubscriptionPayment
} from '../controllers/paymentController.js';
import { protect, isAdmin, isScrapper } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createPaymentOrderValidator,
  verifyPaymentValidator,
  refundPaymentValidator,
  createSubscriptionPaymentValidator,
  verifySubscriptionPaymentValidator
} from '../validators/paymentValidator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Payment routes
router.post('/create-order', createPaymentOrderValidator, validate, createPaymentOrder);
router.post('/verify', verifyPaymentValidator, validate, verifyPayment);
router.get('/my-payments', getMyPayments);
router.get('/order/:orderId/status', getPaymentStatus);
router.get('/:paymentId', getPayment);
router.post('/:paymentId/refund', refundPaymentValidator, validate, refundPaymentAmount);

// Subscription payments (scrapper)
router.post(
  '/subscription/create',
  isScrapper,
  createSubscriptionPaymentValidator,
  validate,
  createSubscriptionPaymentOrder
);
router.post(
  '/subscription/verify',
  isScrapper,
  verifySubscriptionPaymentValidator,
  validate,
  verifySubscriptionPayment
);

export default router;

