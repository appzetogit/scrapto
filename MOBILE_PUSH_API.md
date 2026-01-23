
# Mobile Push Notification Integration API

Use this endpoint to register your mobile app's FCM token. This will save the token to the user's profile and immediately trigger a "Welcome" test notification.

## Endpoint
**POST** `{{BASE_URL}}/api/v1/fcm-tokens/save`
*(e.g., http://localhost:7000/api/v1/fcm-tokens/save)*

## Headers
- **Content-Type**: `application/json`
- **Authorization**: `Bearer <YOUR_JWT_ACCESS_TOKEN>`

## Body
```json
{
  "token": "YOUR_MOBILE_DEVICE_FCM_TOKEN_HERE",
  "platform": "mobile"
}
```

## Behavior
1. **Saves Token**: The token is added to the user's `fcmTokenMobile` array in the database.
2. **Test Notification**: A "Welcome to Scrapto!" notification is automatically sent to this token immediately upon success.

## Example (cURL)
```bash
curl -X POST http://localhost:7000/api/v1/fcm-tokens/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "token": "f5a3...",
    "platform": "mobile"
  }'
```
