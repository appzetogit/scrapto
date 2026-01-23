import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import { sendPushNotification } from '../services/firebaseAdmin.js';

const router = express.Router();

// Save FCM Token
router.post('/save', protect, async (req, res) => {
    try {
        const { token, platform = 'web' } = req.body;
        const userId = req.user.id;

        // Update User model
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Add token to User
        if (platform === 'web') {
            if (!user.fcmTokens) user.fcmTokens = [];
            if (!user.fcmTokens.includes(token)) {
                user.fcmTokens.push(token);
                // Limit to 10
                if (user.fcmTokens.length > 10) user.fcmTokens = user.fcmTokens.slice(-10);
            }
        } else if (platform === 'mobile') {
            if (!user.fcmTokenMobile) user.fcmTokenMobile = [];
            if (!user.fcmTokenMobile.includes(token)) {
                user.fcmTokenMobile.push(token);
                if (user.fcmTokenMobile.length > 10) user.fcmTokenMobile = user.fcmTokenMobile.slice(-10);
            }
        }

        await user.save();

        // If Scrapper, update Scrapper model too
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
                    } else if (platform === 'mobile') {
                        if (!scrapper.fcmTokenMobile) scrapper.fcmTokenMobile = [];
                        if (!scrapper.fcmTokenMobile.includes(token)) {
                            scrapper.fcmTokenMobile.push(token);
                            if (scrapper.fcmTokenMobile.length > 10) scrapper.fcmTokenMobile = scrapper.fcmTokenMobile.slice(-10);
                        }
                    }
                    await scrapper.save();
                }
            } catch (err) {
                console.error('Error updating scrapper tokens:', err);
                // Non-blocking
            }
        }

        // Send Test Notification
        try {
            await sendPushNotification([token], {
                title: 'Welcome to Scrapto!',
                body: `Hello ${user.name}, you are now ready to receive notifications.`,
                data: {
                    type: 'welcome',
                    userId: user._id.toString()
                }
            });
        } catch (notifErr) {
            console.error('Failed to send welcome notification:', notifErr);
        }

        res.json({ success: true, message: 'FCM token saved & test notification sent' });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: 'Failed to save token' });
    }
});

// Remove FCM Token
router.delete('/remove', protect, async (req, res) => {
    try {
        const { token, platform = 'web' } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (user) {
            if (platform === 'web' && user.fcmTokens) {
                user.fcmTokens = user.fcmTokens.filter(t => t !== token);
            } else if (platform === 'mobile' && user.fcmTokenMobile) {
                user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== token);
            }
            await user.save();
        }

        if (user && user.role === 'scrapper') {
            try {
                const scrapper = await Scrapper.findById(userId);
                if (scrapper) {
                    if (platform === 'web' && scrapper.fcmTokens) {
                        scrapper.fcmTokens = scrapper.fcmTokens.filter(t => t !== token);
                    } else if (platform === 'mobile' && scrapper.fcmTokenMobile) {
                        scrapper.fcmTokenMobile = scrapper.fcmTokenMobile.filter(t => t !== token);
                    }
                    await scrapper.save();
                }
            } catch (err) { }
        }

        res.json({ success: true, message: 'FCM token removed' });
    } catch (error) {
        console.error('Error removing FCM token:', error);
        res.status(500).json({ error: 'Failed to remove token' });
    }
});

// Manual Test Notification Route (Useful for mobile dev)
router.post('/test-notification', async (req, res) => {
    try {
        const { token, title, body } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        const response = await sendPushNotification([token], {
            title: title || 'Test Notification',
            body: body || 'This is a test notification from Scrapto',
            data: {
                type: 'test',
                timestamp: new Date().toISOString()
            }
        });

        res.json({ success: true, response });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
