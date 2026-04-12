import { messaging, getToken, onMessage } from '../firebase';
import { apiRequest } from '../modules/shared/utils/api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Register service worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✅ Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            throw error;
        }
    } else {
        throw new Error('Service Workers are not supported');
    }
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            return true;
        } else {
            console.log('❌ Notification permission denied');
            return false;
        }
    }
    return false;
}

// Get FCM token
async function getFCMToken() {
    try {
        const registration = await registerServiceWorker();

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('✅ FCM Token obtained:', token);
            return token;
        } else {
            console.log('❌ No FCM token available');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting FCM token:', error);
        throw error;
    }
}

// Register FCM token with backend
export async function registerFCMToken(forceUpdate = false) {
    try {
        // Check if already registered
        const savedToken = localStorage.getItem('fcm_token_web');
        if (savedToken && !forceUpdate) {
            console.log('FCM token already registered');
            return savedToken;
        }

        // Request permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            throw new Error('Notification permission not granted');
        }

        // Get token
        const token = await getFCMToken();
        if (!token) {
            throw new Error('Failed to get FCM token');
        }

        // Detect platform
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const platformType = isMobile ? 'mobile' : 'web';

        // Save to backend
        // Assuming apiRequest handles Authorization header automatically via localStorage
        const response = await apiRequest('/fcm-tokens/save', {
            method: 'POST',
            body: JSON.stringify({
                token: token,
                platform: platformType
            })
        });

        if (response && response.success) {
            localStorage.setItem('fcm_token_web', token);
            console.log('✅ FCM token registered with backend');
            return token;
        } else {
            throw new Error('Failed to register token with backend');
        }
    } catch (error) {
        console.error('❌ Error registering FCM token:', error);
        // Don't throw for non-critical feature
    }
}

// Setup foreground notification handler
export function setupForegroundNotificationHandler(handler) {
    onMessage(messaging, async (payload) => {
        console.log('📬 Foreground message received:', payload);

        // Force System Notification even in foreground
        try {
            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: payload.notification.icon || '/favicon.png',
                    tag: payload.data?.notificationId || Date.now().toString(),
                    data: payload.data,
                    vibrate: [200, 100, 200],
                    requireInteraction: false
                });
            }
        } catch (err) {
            console.error('Error showing foreground notification:', err);
        }

        // Call custom handler (for UI toasts etc)
        if (handler) {
            handler(payload);
        }
    });
}

// Initialize push notifications
export async function initializePushNotifications() {
    try {
        if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }
        // Token will be registered on login or if already logged in
        const token = localStorage.getItem('token');
        if (token) {
            registerFCMToken();
        }
    } catch (error) {
        console.error('Error initializing push notifications:', error);
    }
}
