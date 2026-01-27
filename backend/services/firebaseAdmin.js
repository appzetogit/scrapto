import admin from 'firebase-admin';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Option 1: Service Account File or Environment Variable
let serviceAccount;

try {
    // Check if we are in production and have the JSON string
    if (process.env.FIREBASE_SERVICE) {
        try {
            let jsonStr = process.env.FIREBASE_SERVICE.trim();
            // Try simplistic parse first
            try {
                serviceAccount = JSON.parse(jsonStr);
            } catch (e) {
                // Heuristic cleanup for escaped strings (e.g. from some env configurations)
                // 1. Strip surrounding quotes if present
                if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                    jsonStr = jsonStr.slice(1, -1);
                }
                // 2. Unescape escaped quotes
                jsonStr = jsonStr.replace(/\\"/g, '"');

                serviceAccount = JSON.parse(jsonStr);
            }

            // Fix private_key newlines if they are literal escaped characters
            if (serviceAccount && serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            console.log('Firebase Admin: Using FIREBASE_SERVICE (JSON) credentials');
        } catch (error) {
            console.error('Firebase Admin: Failed to parse FIREBASE_SERVICE JSON', error.message);
        }
    }

    // If not found yet (or strict local preference), check for file path
    // We prioritize path in development if both are present to match user request "local mei Path use karna hai"
    // However, if we parsed successfully above and we are PROD, we are good. 
    // If we are DEV, we might want to override with PATH if specified.

    const isProduction = process.env.NODE_ENV === 'production';

    // If (Dev AND Path Exists) OR (No Service Account yet AND Path Exists)
    if ((!isProduction && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) || (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
        try {
            // content of path is relative to project root (e.g. ./config/...)
            // we use process.cwd() to resolve it
            const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            serviceAccount = require(serviceAccountPath);
            console.log(`Firebase Admin: Using credentials from file: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
        } catch (error) {
            console.error(`Firebase Admin: Failed to load credentials from file ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`, error);
        }
    }

    // Fallback to hardcoded path if nothing else worked
    if (!serviceAccount) {
        try {
            serviceAccount = require('../config/firebase-service-account.json');
            console.log('Firebase Admin: Using default fallback file: ../config/firebase-service-account.json');
        } catch (error) {
            // Ignore fallback error if we are going to fail safely
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized');
    } else {
        throw new Error('No valid credentials found (FIREBASE_SERVICE or file path)');
    }

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
