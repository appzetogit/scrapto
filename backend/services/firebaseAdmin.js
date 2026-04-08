import admin from 'firebase-admin';

let serviceAccount;

try {
    // Primary Source: FIREBASE_SERVICE_ACCOUNT JSON string from ENV
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            console.log('Firebase Admin: Initialized using FIREBASE_SERVICE_ACCOUNT env variable.');
        } catch (error) {
            console.error('Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', error.message);
        }
    }

    // Final Initialization with validation
    if (serviceAccount && serviceAccount.project_id && (serviceAccount.private_key || serviceAccount.privateKey)) {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`Firebase Admin: Successfully initialized for project: ${serviceAccount.project_id}`);
        } else {
            console.log('Firebase Admin: App already initialized.');
        }
    } else {
        throw new Error('Service account credentials (project_id/private_key) are missing in environment variables.');
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
