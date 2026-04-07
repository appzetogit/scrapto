import admin from 'firebase-admin';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Option 1: Service Account File Path
let serviceAccount;

try {
    // 1. Primary Source: Configurable File Path from ENV (Works for Dev & Prod)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath) {
        try {
            const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
            serviceAccount = require(resolvedPath);
            console.log(`Firebase Admin: Initialized using file: ${resolvedPath}`);
        } catch (error) {
            console.error(`Firebase Admin: Failed to load service account from paths: ${serviceAccountPath}`, error.message);
        }
    }

    // 2. Fallback: Default hardcoded path if ENV variable is not set or file not found
    if (!serviceAccount) {
        try {
            serviceAccount = require('../config/firebase-service-account.json');
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

            console.log('Firebase Admin: Using default fallback file: ../config/firebase-service-account.json');
        } catch (error) {
            // Fallback error is expected if file doesn't exist
        }
    }

    // 3. Final Initialization with validation
    if (serviceAccount && serviceAccount.project_id && (serviceAccount.private_key || serviceAccount.privateKey)) {

        if (admin.apps.length === 0) {
            if (serviceAccount && serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`Firebase Admin: Successfully initialized for project: ${serviceAccount.project_id}`);
        } else {
            console.log('Firebase Admin: App already initialized.');
        }
    } else {
        throw new Error('Service account credentials (project_id/private_key) are missing or file could not be read.');
    }

} catch (error) {
    console.error('❌ Firebase Admin Setup Error:', error.message);
}

// Function to send notification
export async function sendPushNotification(tokens, payload) {
    try {
        if (!tokens || tokens.length === 0) {
            return { successCount: 0, failureCount: 0 };
        }

        // Clean up tokens (remove null/undefined)
        const validTokens = tokens.filter(t => t && typeof t === 'string' && t.trim() !== '');
        
        if (validTokens.length === 0) {
            return { successCount: 0, failureCount: 0 };
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: validTokens, // Array of FCM tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`📡 Notification sent: ${response.successCount} success, ${response.failureCount} failed.`);
        
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Token at index ${idx} failed:`, resp.error.message);
                }
            });
        }

        return response;
    } catch (error) {
        console.error('❌ Error sending message:', error.message);
        return { error: error.message };
    }
}
