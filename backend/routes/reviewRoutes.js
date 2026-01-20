import express from 'express';
import {
  createReview,
  getScrapperReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Public routes (or at least readable by all authenticated users)
router.get('/scrapper/:scrapperId', protect, getScrapperReviews);
router.get('/:id', protect, getReviewById);

// Protected routes
router.use(protect);

router.post('/', authorize(USER_ROLES.USER), createReview);
router.get('/my-reviews', authorize(USER_ROLES.USER), getMyReviews);
router.put('/:id', authorize(USER_ROLES.USER), updateReview);
router.delete('/:id', authorize(USER_ROLES.USER, USER_ROLES.ADMIN), deleteReview);

export default router;
