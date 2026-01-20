import express from 'express';
import { protect, isScrapper } from '../middleware/auth.js';
import {
  getEarningsSummary,
  getEarningsHistory
} from '../controllers/earningsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Scrapper earnings routes
router.get('/summary', isScrapper, getEarningsSummary);
router.get('/history', isScrapper, getEarningsHistory);

export default router;

