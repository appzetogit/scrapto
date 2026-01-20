import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    getScrapperPublicProfile
} from '../controllers/scrapperController.js';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Public routes (or authenticated for users)
router.get('/:id/profile', protect, getScrapperPublicProfile);

// Protected routes (Scrapper only)
router.get('/me', protect, authorize(USER_ROLES.SCRAPPER), getMyProfile);
router.put('/me', protect, authorize(USER_ROLES.SCRAPPER), updateMyProfile);

export default router;
