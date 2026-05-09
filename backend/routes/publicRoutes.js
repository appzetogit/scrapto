import express from 'express';
import { getPublicPrices, getSystemSetting } from '../controllers/publicController.js';

const router = express.Router();

// Public routes (no auth middleware)
router.get('/prices', getPublicPrices);
router.get('/settings/:key', getSystemSetting);

export default router;
