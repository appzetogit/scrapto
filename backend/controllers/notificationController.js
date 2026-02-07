import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Use req.user.id from token payload if req.user is not the full mongoose document
    const userId = req.user.id || req.user._id;

    const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false
    });

    sendSuccess(res, 200, {
        notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user._id;

    const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: userId
    });

    if (!notification) {
        return sendError(res, 404, 'Notification not found');
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    sendSuccess(res, 200, {
        message: 'Notification marked as read',
        notification
    });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user._id;

    await Notification.updateMany(
        { recipient: userId, isRead: false },
        {
            $set: {
                isRead: true,
                readAt: Date.now()
            }
        }
    );

    sendSuccess(res, 200, {
        message: 'All notifications marked as read'
    });
});

/**
 * @desc    Test create notification (For development/testing)
 * @route   POST /api/notifications/test
 * @access  Private
 */
export const createTestNotification = asyncHandler(async (req, res) => {
    const { title, message, type } = req.body;
    const userId = req.user.id || req.user._id;

    const notification = await Notification.create({
        recipient: userId,
        recipientModel: req.user.role === 'scrapper' ? 'Scrapper' : 'User',
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        type: type || 'system',
        data: { test: true }
    });

    sendSuccess(res, 201, {
        message: 'Test notification created',
        notification
    });
});
