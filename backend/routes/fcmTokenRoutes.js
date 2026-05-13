import express from 'express';
import { saveFcmToken, removeFcmToken } from '../controllers/fcmTokenController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/save', saveFcmToken);
router.post('/remove', removeFcmToken);

export default router;
