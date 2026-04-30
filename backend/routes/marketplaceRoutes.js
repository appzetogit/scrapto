import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../services/uploadService.js';
import {
  createMarketplaceRequests,
  getMarketplaceRequests,
  getMarketplaceRequestById,
  placeBid,
  acceptBid,
  uploadMarketplaceImages,
  reportMarketplaceRequest,
  deleteMarketplaceRequest,
  getMyMarketplaceRequests
} from '../controllers/marketplaceController.js';

const router = express.Router();

// Upload images for marketplace
router.post('/upload', protect, authorize('admin'), uploadMultiple('images', 5), uploadMarketplaceImages);

// Publicly authenticated routes
router.use(protect);

// Admin only: Bulk/Single create
router.post('/requests', authorize('admin'), createMarketplaceRequests);
router.delete('/requests/:id', authorize('admin'), deleteMarketplaceRequest);

// User only: Get my marketplace requests
router.get('/my-requests', authorize('user'), getMyMarketplaceRequests);

// Scrapper & Admin: View marketplace
router.get('/requests', authorize('scrapper', 'admin'), getMarketplaceRequests);
router.get('/requests/:id', getMarketplaceRequestById);

// Scrapper only routes
router.post('/requests/:id/bids', authorize('scrapper'), placeBid);
router.post('/requests/:id/report', authorize('scrapper'), reportMarketplaceRequest);

// Admin/User: Accept bid
router.patch('/bids/:bidId/accept', authorize('admin', 'user'), acceptBid);

export default router;
