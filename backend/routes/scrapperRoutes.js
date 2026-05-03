import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    getScrapperPublicProfile,
    updateFcmToken,
    getScrapperStats
} from '../controllers/scrapperController.js';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Public routes (or authenticated for users)
router.get('/:id/profile', protect, getScrapperPublicProfile);

// Protected routes (Scrapper only)
router.get('/me', protect, authorize(USER_ROLES.SCRAPPER), getMyProfile);
router.put('/me', protect, authorize(USER_ROLES.SCRAPPER), updateMyProfile);
router.post('/fcm-token', protect, authorize(USER_ROLES.SCRAPPER), updateFcmToken);
router.get('/stats', protect, authorize(USER_ROLES.SCRAPPER), getScrapperStats);

export default router;
