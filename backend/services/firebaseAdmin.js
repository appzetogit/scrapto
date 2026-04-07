import admin from 'firebase-admin';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Option 1: Service Account File or Environment Variable
let serviceAccount;

try {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
    console.log(`Firebase Admin: Environment is '${process.env.NODE_ENV}', isProduction: ${isProduction}`);

    // Option 1: Env Variable (Prioritize this if present)
    if (process.env.FIREBASE_SERVICE) {
        console.log('Firebase Admin: Found FIREBASE_SERVICE env variable. Attempting to parse...');
        try {
            let jsonStr = process.env.FIREBASE_SERVICE.trim();
            
            // Helper to recursively parse JSON if it's double-encoded as a string
            const multiParse = (str) => {
                let current = str;
                if (typeof current === 'string' && current.includes('\\"')) {
                    current = current.replace(/\\"/g, '"');
                }
                if (typeof current === 'string' && current.startsWith('"') && current.endsWith('"')) {
                    current = current.slice(1, -1);
                }

                try {
                     let parsed = JSON.parse(current);
                     if (typeof parsed === 'string') return multiParse(parsed);
                     return parsed;
                } catch (e) {
                     return null;
                }
            };

            const parsed = multiParse(jsonStr);
            if (parsed && typeof parsed === 'object') {
                serviceAccount = parsed;
                console.log('Firebase Admin: Successfully parsed FIREBASE_SERVICE JSON object.');
            } else {
                console.error('Firebase Admin: FIREBASE_SERVICE was found but multiParse returned null or non-object.');
            }

            // Fix private_key newlines if they are literal escaped characters
            if (serviceAccount && serviceAccount.private_key) {
                if (serviceAccount.private_key.includes('\\n')) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                    console.log('Firebase Admin: Fixed escaped newlines in private_key.');
                }
            }
        } catch (error) {
            console.error('Firebase Admin: Fatal error during FIREBASE_SERVICE parsing:', error.message);
        }
    }

    // Option 2: File Path (Used in dev, or if variable failed/missing)
    const canUseFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    // We use file path if:
    // 1. We are NOT in production
    // 2. OR we are in production but the environment variable failed to provide a serviceAccount
    if (canUseFilePath && (!isProduction || !serviceAccount)) {
        console.log(`Firebase Admin: Trying to load credentials from file path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
        try {
            const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            serviceAccount = require(serviceAccountPath);
            console.log('Firebase Admin: Successfully loaded credentials from file.');
        } catch (error) {
            console.error(`Firebase Admin: Failed to load file from ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}:`, error.message);
        }
    }

    // Fallback to hardcoded path if nothing else worked
    if (!serviceAccount) {
        console.log('Firebase Admin: No credentials from ENV or Path. Trying default fallback file...');
        try {
            serviceAccount = require('../config/firebase-service-account.json');
            console.log('Firebase Admin: Loaded fallback file.');
        } catch (error) {
            // Ignore if fallback missing
        }
    }

    // FINAL INITIALIZATION
    if (serviceAccount && serviceAccount.project_id && (serviceAccount.private_key || serviceAccount.privateKey)) {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`Firebase Admin: Initialized for project: ${serviceAccount.project_id}`);
        } else {
            console.log('Firebase Admin: Already initialized.');
        }
    } else {
        const reason = !serviceAccount ? 'No credentials found' : 
                       !serviceAccount.project_id ? 'Missing project_id' : 'Missing private_key';
        throw new Error(`Initialization aborted: ${reason}`);
    }

} catch (error) {
    console.error('❌ Firebase Admin Setup Error:', error.message);
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
