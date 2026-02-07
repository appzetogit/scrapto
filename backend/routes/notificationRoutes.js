import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createTestNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.route('/')
    .get(protect, getNotifications);

router.route('/:id/read')
    .put(protect, markNotificationRead);

router.route('/read-all')
    .put(protect, markAllNotificationsRead);

router.route('/test')
    .post(protect, createTestNotification);

export default router;
