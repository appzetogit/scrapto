import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import { adminRateLimiter } from '../middleware/rateLimiter.js';
import {
  // Dashboard & Analytics
  getDashboardStats,
  getPaymentAnalytics,

  // User Management
  getAllUsers,
  getUserById,
  updateUser,
  blockUser,
  deleteUser,

  // Scrapper Management
  getAllScrappers,
  getScrapperById,
  updateScrapper,
  updateScrapperStatus,
  deleteScrapper,

  // Order Management
  getAllOrders,
  getOrderById,
  updateOrder,
  assignOrder,
  cancelOrder,

  // Price Feed Management
  getAllPrices,
  createPrice,
  updatePrice,
  deletePrice,

  // Subscription Plan Management
  createPlan,
  updatePlan,

  deletePlan,
  getAllSubscriptions,
  getAllSubscriptionPlans,
  withdrawFunds,
  updateAdminBankDetails
} from '../controllers/adminController.js';
import { getScrapperEarningsForAdmin } from '../controllers/earningsController.js';
import {
  getAllReviews,
  getAdminReviewById,
  approveReview,
  rejectReview,
  deleteAdminReview,
  getReviewAnalytics
} from '../controllers/reviewController.js';

// Lead Management
import {
  getAllLeads,
  createLead,
  updateLead,
  deleteLead
} from '../controllers/leadController.js';

const router = express.Router();

// All admin routes require authentication and admin role
// Apply admin rate limiter (higher limits for admin)
router.use(adminRateLimiter);
router.use(protect);
router.use(isAdmin);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/payments', getPaymentAnalytics);

// ============================================
// USER MANAGEMENT
// ============================================
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.patch('/users/:id/block', blockUser);
router.delete('/users/:id', deleteUser);

// ============================================
// SCRAPPER MANAGEMENT
// ============================================
router.get('/scrappers', getAllScrappers);
router.get('/scrappers/:id', getScrapperById);
router.put('/scrappers/:id', updateScrapper);
router.patch('/scrappers/:id/status', updateScrapperStatus);
router.delete('/scrappers/:id', deleteScrapper);

// ============================================
// ORDER MANAGEMENT
// ============================================
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id', updateOrder);
router.post('/orders/:id/assign', assignOrder);
router.post('/orders/:id/cancel', cancelOrder);

// ============================================
// PRICE FEED MANAGEMENT
// ============================================
router.get('/prices', getAllPrices);
router.post('/prices', createPrice);
router.put('/prices/:id', updatePrice);
router.delete('/prices/:id', deletePrice);

// ============================================
// SUBSCRIPTION PLAN MANAGEMENT
// ============================================
router.get('/subscriptions/plans', getAllSubscriptionPlans);
router.post('/subscriptions/plans', createPlan);
router.put('/subscriptions/plans/:id', updatePlan);
router.delete('/subscriptions/plans/:id', deletePlan);
router.get('/subscriptions/all', getAllSubscriptions);

// ============================================
// EARNINGS MANAGEMENT
// ============================================
router.get('/scrappers/:scrapperId/earnings', getScrapperEarningsForAdmin);

// ============================================
// REVIEW MANAGEMENT
// ============================================
router.get('/reviews', getAllReviews);
router.get('/reviews/analytics', getReviewAnalytics);
router.get('/reviews/:reviewId', getAdminReviewById);
router.put('/reviews/:reviewId/approve', approveReview);
router.put('/reviews/:reviewId/reject', rejectReview);
router.delete('/reviews/:reviewId', deleteAdminReview);

// ============================================
// LEAD MANAGEMENT
// ============================================
router.get('/leads', getAllLeads);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

// ============================================
// FINANCE MANAGEMENT
// ============================================
router.put('/finance/bank-details', updateAdminBankDetails);
router.post('/finance/withdraw', withdrawFunds);

export default router;
