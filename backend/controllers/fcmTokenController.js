import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

/**
 * Save or update FCM token for the authenticated user
 * Works for Users, Scrappers, and Admins
 */
export const saveFcmToken = asyncHandler(async (req, res) => {
    const { token, platform = 'web' } = req.body;
    const userId = req.user.id;

    if (!token) {
        return sendError(res, 'Token is required', 400);
    }

    // 1. Update User model (All roles have a User entry)
    const user = await User.findById(userId);
    if (!user) {
        return sendError(res, 'User not found', 404);
    }

    if (platform === 'web') {
        if (!user.fcmTokens) user.fcmTokens = [];
        if (!user.fcmTokens.includes(token)) {
            user.fcmTokens.push(token);
            if (user.fcmTokens.length > 10) user.fcmTokens = user.fcmTokens.slice(-10);
        }
    } else {
        if (!user.fcmTokenApp) user.fcmTokenApp = [];
        if (!user.fcmTokenApp.includes(token)) {
            user.fcmTokenApp.push(token);
            if (user.fcmTokenApp.length > 10) user.fcmTokenApp = user.fcmTokenApp.slice(-10);
        }
    }
    await user.save();

    // 2. If user is a scrapper, sync with Scrapper model
    if (user.role === 'scrapper') {
        try {
            const scrapper = await Scrapper.findById(userId);
            if (scrapper) {
                if (platform === 'web') {
                    if (!scrapper.fcmTokens) scrapper.fcmTokens = [];
                    if (!scrapper.fcmTokens.includes(token)) {
                        scrapper.fcmTokens.push(token);
                        if (scrapper.fcmTokens.length > 10) scrapper.fcmTokens = scrapper.fcmTokens.slice(-10);
                    }
                } else {
                    if (!scrapper.fcmTokenApp) scrapper.fcmTokenApp = [];
                    if (!scrapper.fcmTokenApp.includes(token)) {
                        scrapper.fcmTokenApp.push(token);
                        if (scrapper.fcmTokenApp.length > 10) scrapper.fcmTokenApp = scrapper.fcmTokenApp.slice(-10);
                    }
                }
                await scrapper.save();
            }
        } catch (error) {
            logger.warn(`Failed to sync FCM token to Scrapper model for user ${userId}:`, error.message);
        }
    }

    sendSuccess(res, 'FCM token saved successfully');
});

/**
 * Remove FCM token (e.g., on logout)
 */
export const removeFcmToken = asyncHandler(async (req, res) => {
    const { token, platform = 'web' } = req.body;
    const userId = req.user.id;

    if (!token) {
        return sendError(res, 'Token is required', 400);
    }

    // 1. Remove from User model
    const user = await User.findById(userId);
    if (user) {
        if (platform === 'web') {
            user.fcmTokens = (user.fcmTokens || []).filter(t => t !== token);
        } else {
            user.fcmTokenApp = (user.fcmTokenApp || []).filter(t => t !== token);
        }
        await user.save();
    }

    // 2. Remove from Scrapper model if applicable
    if (user && user.role === 'scrapper') {
        try {
            const scrapper = await Scrapper.findById(userId);
            if (scrapper) {
                if (platform === 'web') {
                    scrapper.fcmTokens = (scrapper.fcmTokens || []).filter(t => t !== token);
                } else {
                    scrapper.fcmTokenApp = (scrapper.fcmTokenApp || []).filter(t => t !== token);
                }
                await scrapper.save();
            }
        } catch (error) {
            logger.warn(`Failed to remove FCM token from Scrapper model for user ${userId}:`, error.message);
        }
    }

    sendSuccess(res, 'FCM token removed successfully');
});
