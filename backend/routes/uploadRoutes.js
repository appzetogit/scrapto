import express from 'express';
import { protect, isUser, isScrapper } from '../middleware/auth.js';
import { uploadMultiple, uploadFields } from '../services/uploadService.js';
import { uploadOrderImages, uploadKycDocs } from '../controllers/uploadController.js';

const router = express.Router();

// Order images (user)
router.post(
  '/order-images',
  protect,
  isUser,
  uploadMultiple('images', 5),
  uploadOrderImages
);

// KYC documents (scrapper)
router.post(
  '/kyc-docs',
  protect,
  isScrapper,
  uploadFields([
    { name: 'aadhaar', maxCount: 2 },
    { name: 'selfie', maxCount: 1 },
    { name: 'license', maxCount: 2 },
  ]),
  uploadKycDocs
);

export default router;


