import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAvailableOrders,
  getMyAssignedOrders,
  getOrderById,
  acceptOrder,
  updateOrderStatus,
  cancelOrder,
  updateOrder
} from '../controllers/orderController.js';
import { protect, isUser, isScrapper } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createOrderValidator,
  updateOrderStatusValidator,
  cancelOrderValidator,
  updateOrderValidator
} from '../validators/orderValidator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Scrapper routes (Specific paths first)
router.get('/available', isScrapper, getAvailableOrders);
router.get('/my-assigned', isScrapper, getMyAssignedOrders);

// User routes & Generic ID routes
router.post('/', isUser, createOrderValidator, validate, createOrder);
router.get('/my-orders', isUser, getMyOrders);

// Generic ID routes (Must be after specific paths)
router.get('/:id', getOrderById);
router.put('/:id', isUser, updateOrderValidator, validate, updateOrder);
router.put('/:id/status', updateOrderStatusValidator, validate, updateOrderStatus);
router.post('/:id/cancel', cancelOrderValidator, validate, cancelOrder);
router.post('/:id/accept', isScrapper, acceptOrder);

export default router;

