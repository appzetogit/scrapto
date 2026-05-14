import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import { sendPushNotification } from '../services/firebaseService.js';
import logger from './logger.js';

/**
 * Send notification to a specific user (can be USER, SCRAPPER, or ADMIN)
 * @param {string} userId - User ID
 * @param {Object} payload - Notification payload { title, body, data }
 * @param {boolean} includeApp - Whether to include app tokens
 */
export const sendNotificationToUser = async (userId, payload, includeApp = true) => {
    try {
        // Try to find in User model first
        let user = await User.findById(userId);
        let scrapper = null;

        // If user not found or is a scrapper, also check Scrapper model for tokens
        if (user && user.role === 'scrapper') {
            scrapper = await Scrapper.findById(userId);
        } else if (!user) {
            // Might be a scrapper ID directly
            scrapper = await Scrapper.findById(userId);
        }

        let tokens = [];
        const getSafeTokens = (model) => {
            const webTokens = Array.isArray(model.fcmTokens) ? model.fcmTokens : [];
            const appTokens = Array.isArray(model.fcmTokenApp) ? model.fcmTokenApp : [];
            return [...webTokens, ...appTokens];
        };

        if (user) {
            tokens = [...tokens, ...getSafeTokens(user)];
        }

        if (scrapper) {
            tokens = [...tokens, ...getSafeTokens(scrapper)];
        }

        // Remove duplicates and empty tokens
        const uniqueTokens = [...new Set(tokens)].filter(t => t);

        logger.info(`Notification Debug for ${userId}: Found ${uniqueTokens.length} tokens. User exists: ${!!user}, Scrapper exists: ${!!scrapper}`);

        if (uniqueTokens.length === 0) {
            logger.info(`No FCM tokens found for user ${userId}`);
            return null;
        }

        return await sendPushNotification(uniqueTokens, payload);
    } catch (error) {
        logger.error(`Error sending notification to user ${userId}:`, error.message);
        // Don't throw, notifications are non-critical
        return null;
    }
};

/**
 * Send notification to multiple users
 * @param {string[]} userIds - Array of User IDs
 * @param {Object} payload - Notification payload
 */
export const sendNotificationToMultipleUsers = async (userIds, payload) => {
    try {
        const promises = userIds.map(userId => sendNotificationToUser(userId, payload));
        return await Promise.all(promises);
    } catch (error) {
        logger.error('Error sending multiple notifications:', error.message);
        return null;
    }
};
