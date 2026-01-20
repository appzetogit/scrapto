import express from 'express';
import {
  getPlans,
  getPlan,
  getMySubscription,
  subscribe,
  verifyPayment,
  cancel,
  renew,
  getHistory
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';
import { isScrapper } from '../middleware/auth.js';

const router = express.Router();

// Public routes (or can be protected for scrappers only)
router.get('/plans', getPlans);
router.get('/plans/:id', getPlan);

// Protected routes (Scrapper only)
router.use(protect); // All routes below require authentication
router.use(isScrapper); // All routes below require scrapper role

router.get('/my-subscription', getMySubscription);
router.post('/subscribe', subscribe);
router.post('/verify-payment', verifyPayment);
router.post('/cancel', cancel);
router.post('/renew', renew);
router.get('/history', getHistory);

export default router;





