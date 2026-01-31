import Scrapper from '../models/Scrapper.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

export const getMyProfile = asyncHandler(async (req, res) => {
    let scrapper = await Scrapper.findById(req.user.id);

    // Auto-provision if missing
    if (!scrapper) {
        logger.info(`Scrapper profile missing for user ${req.user.id}, auto-provisioning...`);

        // Ensure we have phone/email from user
        // req.user might be partial depending on middleware, safe to fetch fresh
        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'scrapper') {
            return sendError(res, 'Scrapper user not found', 404);
        }

        scrapper = await Scrapper.create({
            _id: user._id,
            phone: user.phone,
            name: user.name || 'Scrapper',
            email: user.email,
            vehicleInfo: { type: 'bike', number: 'NA', capacity: 0 }
        });

        logger.info(`Auto-provisioned scrapper profile: ${scrapper._id}`);
    }

    sendSuccess(res, 'Scrapper profile fetched successfully', { scrapper });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
    const { name, vehicleInfo, availability, isOnline } = req.body;
    const userId = req.user.id || req.user._id;

    // 1. Update Scrapper Document
    let scrapper = await Scrapper.findById(userId);

    // Auto-provision if missing (Edge case protection)
    if (!scrapper) {
        const user = await User.findById(userId);
        if (user && user.role === 'scrapper') {
            scrapper = await Scrapper.create({
                _id: userId,
                phone: user.phone,
                name: user.name || name || 'Scrapper',
                email: user.email,
                vehicleInfo: vehicleInfo || { type: 'bike', number: 'NA', capacity: 0 }
            });
        } else {
            return sendError(res, 'Scrapper profile not found', 404);
        }
    } else {
        if (name) scrapper.name = name;
        if (vehicleInfo) scrapper.vehicleInfo = { ...scrapper.vehicleInfo, ...vehicleInfo };

        // Update Online Status
        if (availability !== undefined) scrapper.isOnline = availability;
        if (isOnline !== undefined) scrapper.isOnline = isOnline;

        await scrapper.save();
    }

    // 2. Sync with User Document (Crucial for "har jagah update")
    if (name) {
        const user = await User.findById(userId);
        if (user) {
            user.name = name;
            await user.save();
        }
    }

    sendSuccess(res, 'Profile updated successfully', { scrapper });
});

export const getScrapperPublicProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const scrapper = await Scrapper.findById(id).select('-earnings -kyc.aadhaarNumber');

    if (!scrapper) {
        return sendError(res, 'Scrapper not found', 404);
    }

    sendSuccess(res, 'Scrapper fetched successfully', { scrapper });
});

export const updateFcmToken = asyncHandler(async (req, res) => {
    const { token, platform = 'web' } = req.body;
    const scrapperId = req.user.id;

    if (!token) {
        return sendError(res, 'Token is required', 400);
    }

    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
        return sendError(res, 'Scrapper profile not found', 404);
    }

    // Update Scrapper model
    if (platform === 'web') {
        if (!scrapper.fcmTokens) scrapper.fcmTokens = [];
        if (!scrapper.fcmTokens.includes(token)) {
            scrapper.fcmTokens.push(token);
            if (scrapper.fcmTokens.length > 10) scrapper.fcmTokens = scrapper.fcmTokens.slice(-10);
        }
    } else {
        // mobile
        if (!scrapper.fcmTokenMobile) scrapper.fcmTokenMobile = [];
        if (!scrapper.fcmTokenMobile.includes(token)) {
            scrapper.fcmTokenMobile.push(token);
            if (scrapper.fcmTokenMobile.length > 10) scrapper.fcmTokenMobile = scrapper.fcmTokenMobile.slice(-10);
        }
    }
    await scrapper.save();

    // Sync with User model (optional but recommended since auth is shared)
    try {
        const user = await User.findById(scrapperId);
        if (user) {
            if (platform === 'web') {
                if (!user.fcmTokens) user.fcmTokens = [];
                if (!user.fcmTokens.includes(token)) {
                    user.fcmTokens.push(token);
                    if (user.fcmTokens.length > 10) user.fcmTokens = user.fcmTokens.slice(-10);
                }
            } else {
                if (!user.fcmTokenMobile) user.fcmTokenMobile = [];
                if (!user.fcmTokenMobile.includes(token)) {
                    user.fcmTokenMobile.push(token);
                    if (user.fcmTokenMobile.length > 10) user.fcmTokenMobile = user.fcmTokenMobile.slice(-10);
                }
            }
            await user.save();
        }
    } catch (error) {
        logger.warn('Failed to sync FCM token to User model:', error.message);
    }

    sendSuccess(res, 'FCM token updated successfully');
});
