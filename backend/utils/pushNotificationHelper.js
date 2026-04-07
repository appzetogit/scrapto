import { sendPushNotification } from '../services/firebaseAdmin.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import Notification from '../models/Notification.js';
import { notifyUser } from '../services/socketService.js';

/**
 * Send notification to a specific user or scrapper
 * @param {string} userId - User or Scrapper ID
 * @param {object} payload - { title, body, data }
 * @param {string} role - 'user' or 'scrapper', default 'user'
 * @param {boolean} includeMobile - whether to include mobile tokens
 */
export async function sendNotificationToUser(userId, payload, role = 'user', includeMobile = true) {
    try {
        let user;

        if (role === 'scrapper') {
            user = await Scrapper.findById(userId);
        } else {
            user = await User.findById(userId);
        }

        if (!user) {
            console.warn(`User/Scrapper with ID ${userId} not found for notification`);
            return;
        }

        // Collect tokens
        let tokens = [];
        if (user.fcmTokens && user.fcmTokens.length > 0) {
            tokens = [...tokens, ...user.fcmTokens];
        }
        if (includeMobile && user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
            tokens = [...tokens, ...user.fcmTokenMobile];
        }

        // Remove duplicates
        const uniqueTokens = [...new Set(tokens)];

        if (uniqueTokens.length === 0) {
            return;
        }

        // Create notification in database for persistence (Notification Center)
        try {
            await Notification.create({
                recipient: userId,
                recipientModel: role === 'scrapper' ? 'Scrapper' : 'User',
                title: payload.title,
                message: payload.body,
                type: payload.data?.type || 'system',
                data: payload.data || {}
            });

            // Notify via Socket for real-time UI update if online
            notifyUser(userId, 'new_notification', {
                title: payload.title,
                message: payload.body,
                type: payload.data?.type || 'system',
                data: payload.data || {},
                createdAt: new Date().toISOString()
            });
        } catch (dbError) {
            console.error('Error saving notification to DB:', dbError);
        }

        // Send push notification via FCM
        await sendPushNotification(uniqueTokens, payload);
    } catch (error) {
        console.error('Error sending notification helper:', error);
    }
}
