import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import { uploadSingle } from '../services/uploadService.js';
import {
    createBanner,
    getAllBanners,
    getActiveBanners,
    updateBanner,
    deleteBanner,
    toggleBannerStatus
} from '../controllers/bannerController.js';

const router = express.Router();

// Public routes
router.get('/public', getActiveBanners);

// Admin routes
router.use(protect, isAdmin);

router.post('/', uploadSingle('image'), createBanner);
router.get('/admin/all', getAllBanners);
router.put('/:id', uploadSingle('image'), updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/status', toggleBannerStatus);

export default router;
