import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Option 1: Service Account File
const serviceAccount = require('../config/firebase-service-account.json');

// Check if we have env var for service account path or object
// For now using the file we created
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
} catch (error) {
    console.log('Firebase Admin Initialization Skipped/Failed (Check credentials):', error.message);
}

// Function to send notification
export async function sendPushNotification(tokens, payload) {
    try {
        if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens, // Array of FCM tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent: ${response.successCount} messages`);
        if (response.failureCount > 0) {
            console.log(`Failed: ${response.failureCount} messages`);
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Token at index ${idx} failed:`, resp.error);
                }
            });
        }

        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        // Don't throw to avoid crashing flow, just return error
        return { error: error.message };
    }
}
