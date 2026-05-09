import express from 'express';
import { protect, isUser, isScrapper, isAdmin, authorize } from '../middleware/auth.js';
import { uploadMultiple, uploadFields, uploadFile } from '../services/uploadService.js';
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

// System media (admin)
router.post(
  '/system-media',
  protect,
  authorize('admin'),
  uploadMultiple('media', 1),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const file = req.files[0];
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

      const result = await uploadFile(file, {
        folder: 'system',
        resource_type: resourceType
      });

      res.status(200).json({ success: true, url: result.secure_url });
    } catch (error) {
      console.error('System media upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;


