import express from 'express';
import { protect, isScrapper, isAdmin } from '../middleware/auth.js';
import { uploadFields } from '../services/uploadService.js';
import { submitKyc, getMyKyc, verifyKyc, rejectKyc, getAllScrappersWithKyc } from '../controllers/kycController.js';

const router = express.Router();

// Scrapper: submit and view own KYC
router.post(
  '/',
  protect,
  isScrapper,
  uploadFields([
    { name: 'aadhaar', maxCount: 2 },
    { name: 'selfie', maxCount: 1 },
    { name: 'license', maxCount: 2 },
  ]),
  submitKyc
);

router.get('/me', protect, isScrapper, getMyKyc);

// Admin actions
router.get('/scrappers', protect, isAdmin, getAllScrappersWithKyc);
router.post('/:id/verify', protect, isAdmin, verifyKyc);
router.post('/:id/reject', protect, isAdmin, rejectKyc);

export default router;



