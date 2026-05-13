import { messaging, getToken, onMessage } from '../firebase';
import { fcmAPI } from '../modules/shared/utils/api';


const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Register service worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// Get FCM token
async function getFCMToken() {
    try {
        const registration = await registerServiceWorker();
        // Force update to ensure we have the latest SW
        await registration.update();
        
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });
        
        return token;
    } catch (error) {
        console.error('❌ Error getting FCM token:', error);
        return null;
    }
}

// Register FCM token with backend
async function registerFCMToken(forceUpdate = false) {
    try {
        // Check if already registered in this session
        const savedToken = localStorage.getItem('fcm_token_registered');
        if (savedToken && !forceUpdate) {
            return savedToken;
        }
        
        // Request permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            return null;
        }
        
        // Get token
        const token = await getFCMToken();
        if (!token) {
            return null;
        }
        
        // Save to backend
        const response = await fcmAPI.saveToken(token, 'web');
        
        if (response.success) {
            localStorage.setItem('fcm_token_registered', token);
            console.log('✅ FCM token registered successfully');
            return token;
        }
        return null;
    } catch (error) {
        console.error('❌ Error registering FCM token:', error);
        return null;
    }
}

// Setup foreground notification handler
function setupForegroundNotificationHandler() {
    return onMessage(messaging, (payload) => {
        console.log('📬 Foreground message received:', payload);
        
        // If the app is in focus, we might want to show a toast instead of a browser notification
        // or just show the browser notification anyway
        if (Notification.permission === 'granted') {
            const { title, body, icon } = payload.notification;
            new Notification(title, {
                body,
                icon: icon || '/favicon.png',
                data: payload.data
            });
        }
    });
}

export {
    registerFCMToken,
    setupForegroundNotificationHandler,
    requestNotificationPermission
};
