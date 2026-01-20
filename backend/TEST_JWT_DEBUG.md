# JWT Secret Debugging Guide

This guide helps you test and see where the JWT_SECRET is being verified from.

## 1. Check JWT Configuration Endpoint

After starting your backend server, visit this URL in your browser or use curl:

```bash
# Browser
http://localhost:7000/api/debug/jwt-config

# Or using curl
curl http://localhost:7000/api/debug/jwt-config
```

This will show you:
- Whether `JWT_SECRET` is set in environment variables
- Which secret is being used (env or default)
- Secret length and preview
- JWT expiry settings

## 2. Monitor Backend Logs

When you login or make authenticated requests, watch your backend terminal. You'll see:

### When Token is Generated (during login/signup):
```
🔑 Generating JWT Token: {
  userId: '...',
  role: 'user',
  secretSource: 'process.env.JWT_SECRET' or 'DEFAULT_JWT_SECRET',
  secretLength: 45,
  secretPreview: 'your-secret-preview...',
  expiresIn: '7d'
}
✅ Token generated successfully: {
  tokenLength: 200,
  tokenPreview: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### When Token is Verified (during API requests):
```
🔐 Auth Middleware Debug: {
  path: '/uploads/order-images',
  method: 'POST',
  hasAuthHeader: true,
  authHeaderPrefix: 'Bearer eyJhbGciOiJIUzI1',
  hasToken: true,
  tokenLength: 200
}
🔑 Verifying JWT Token: {
  secretSource: 'process.env.JWT_SECRET' or 'DEFAULT_JWT_SECRET',
  secretLength: 45,
  secretPreview: 'your-secret-preview...',
  tokenLength: 200,
  tokenPreview: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
✅ Token verified successfully: {
  userId: '...',
  role: 'user',
  iat: 1234567890,
  exp: 1234567890,
  expiresAt: '2024-01-08T12:00:00.000Z',
  isExpired: false
}
```

### If Token Verification Fails:
```
❌ Token verification failed: {
  error: 'invalid signature' or 'jwt expired' or 'jwt malformed',
  errorName: 'JsonWebTokenError' or 'TokenExpiredError',
  path: '/uploads/order-images'
}
```

## 3. Common Issues and Solutions

### Issue: "invalid signature"
**Cause**: The secret used to sign the token is different from the secret used to verify it.

**Solution**:
1. Check if `JWT_SECRET` in `.env` matches what was used when the token was generated
2. If you changed `JWT_SECRET` after generating tokens, all old tokens will be invalid
3. Clear localStorage and login again to get a new token with the current secret

### Issue: "jwt expired"
**Cause**: Token has passed its expiration time.

**Solution**:
1. Check `JWT_EXPIRE` in `.env` (should be `7d` for 7 days)
2. Clear localStorage and login again to get a fresh token

### Issue: "jwt malformed"
**Cause**: Token format is incorrect or corrupted.

**Solution**:
1. Check if token is being stored correctly in localStorage
2. Check browser console for token storage logs
3. Clear localStorage and login again

## 4. Testing Steps

1. **Start backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Check JWT config**:
   ```bash
   curl http://localhost:7000/api/debug/jwt-config
   ```
   Note the `secretSource` - it should be `process.env.JWT_SECRET` if you have `.env` set up.

3. **Clear browser localStorage**:
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage
   - Or run in console: `localStorage.clear()`

4. **Login again**:
   - Watch backend logs for token generation
   - Check browser console for token storage confirmation

5. **Try uploading an image**:
   - Watch backend logs for token verification
   - Check if secret sources match (generation vs verification)

## 5. Verify Secret Match

The secret used for **generation** and **verification** must be the same:

- **Generation** (login): Check logs for `🔑 Generating JWT Token` → `secretSource`
- **Verification** (upload): Check logs for `🔑 Verifying JWT Token` → `secretSource`

Both should show the same `secretSource` and `secretPreview`.

## 6. Frontend Console Logs

Open browser DevTools (F12) and check Console tab. You'll see:

- When token is stored: `✅ Token stored in localStorage: {...}`
- When making API requests: `🔍 API Request Debug: {...}`

These logs show if the token is being sent correctly.






