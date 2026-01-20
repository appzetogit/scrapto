import express from 'express';
import { getPublicPrices } from '../controllers/publicController.js';

const router = express.Router();

// Public routes (no auth middleware)
router.get('/prices', getPublicPrices);

export default router;
