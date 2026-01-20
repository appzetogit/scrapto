# Auth API Integration Guide

## Overview

The frontend has been integrated with the backend authentication APIs. All auth flows now use real API calls instead of mock data.

## API Endpoints Used

### Base URL
- Development: `http://localhost:7000/api`
- Set via environment variable: `VITE_API_BASE_URL`

### Endpoints

1. **POST /api/auth/register** - Register new user/scrapper
2. **POST /api/auth/login-otp** - Send OTP for login
3. **POST /api/auth/verify-otp** - Verify OTP
4. **POST /api/auth/resend-otp** - Resend OTP
5. **GET /api/auth/me** - Get current user (protected)
6. **PUT /api/auth/profile** - Update profile (protected)

## Files Modified

### 1. `frontend/src/modules/shared/utils/api.js` (NEW)
- API service file with all auth endpoints
- Handles token management
- Error handling

### 2. `frontend/src/modules/shared/context/AuthContext.jsx`
- Updated to use backend APIs
- Token storage and verification
- Auto-verification on mount

### 3. `frontend/src/modules/user/components/LoginSignup.jsx`
- Integrated with register, sendLoginOTP, verifyOTP, resendOTP APIs
- Real-time error handling
- Loading states

### 4. `frontend/src/modules/scrapper/components/ScrapperLogin.jsx`
- Integrated with register, sendLoginOTP, verifyOTP, resendOTP APIs
- Real-time error handling
- Loading states

## Testing Guide

### Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Environment Variables**
   - Backend `.env` should have SMSIndia Hub credentials
   - Frontend can use default `http://localhost:7000/api` or set `VITE_API_BASE_URL`

3. **MongoDB Running**
   - Ensure MongoDB is running and connected

### Test Cases

#### 1. User Registration Flow

1. Navigate to `/user/login` (or wherever LoginSignup is)
2. Click "Sign Up"
3. Fill in:
   - Name: "Test User"
   - Phone: Use test number `7610416911` (OTP: `110211`) or `9685974247` (OTP: `123456`)
   - Optional: Referral code, "How did you hear about us"
4. Click "Register & Send OTP"
5. **Expected**: OTP sent message, OTP input appears
6. Enter OTP: `110211` (for 7610416911) or `123456` (for other test numbers)
7. **Expected**: Auto-submit on 6th digit, user logged in, redirected to dashboard

#### 2. User Login Flow

1. Navigate to `/user/login`
2. Click "Login" (should be selected by default)
3. Enter phone: `7610416911` (or any registered number)
4. Click "Send OTP"
5. **Expected**: OTP sent, OTP input appears
6. Enter OTP: `110211`
7. **Expected**: User logged in, redirected to dashboard

#### 3. Scrapper Registration Flow

1. Navigate to `/scrapper/login`
2. Click "Register"
3. Fill in:
   - Name: "Test Scrapper"
   - Vehicle Info: "Truck - MH-12-AB-1234"
   - Phone: `7610416911`
   - Optional: Referral code, "How did you hear about us"
4. Click "Register & Send OTP"
5. **Expected**: OTP sent, OTP input appears
6. Enter OTP: `110211`
7. **Expected**: Scrapper logged in, redirected based on KYC status

#### 4. Scrapper Login Flow

1. Navigate to `/scrapper/login`
2. Click "Login"
3. Enter phone: `7610416911`
4. Click "Send OTP"
5. **Expected**: OTP sent, OTP input appears
6. Enter OTP: `110211`
7. **Expected**: Scrapper logged in, redirected based on KYC status

#### 5. Resend OTP

1. Start any registration/login flow
2. Wait for OTP input
3. Click "Resend OTP"
4. **Expected**: New OTP sent, OTP input cleared, ready for new OTP

#### 6. Error Handling

1. **Invalid Phone**: Enter less than 10 digits
   - **Expected**: Error message, button disabled

2. **Invalid OTP**: Enter wrong OTP
   - **Expected**: Error message "Invalid or expired OTP", OTP cleared

3. **Network Error**: Stop backend server, try to register
   - **Expected**: Error message about connection failure

4. **Duplicate Registration**: Try to register with existing phone
   - **Expected**: Error message "User already exists with this email or phone"

## Test Phone Numbers (Bypass OTP)

These numbers use fixed OTPs (same as CreateBharat):

- `7610416911` → OTP: `110211`
- `9685974247`, `9876543210`, `9999999999` → OTP: `123456`

For other numbers, OTP will be sent via SMS (if SMSIndia Hub is configured).

## Environment Setup

### Frontend `.env` (optional)
```env
VITE_API_BASE_URL=http://localhost:7000/api
```

### Backend `.env` (required)
```env
MONGODB_URI=mongodb://localhost:27017/scrapto
JWT_SECRET=your-secret-key
SMSINDIAHUB_API_KEY=your-api-key
SMSINDIAHUB_SENDER_ID=your-sender-id
```

## Troubleshooting

### 1. CORS Errors
- Ensure backend has CORS configured for frontend URL
- Check `FRONTEND_URL` in backend `.env`

### 2. OTP Not Sending
- Check SMSIndia Hub credentials in backend `.env`
- Check backend logs for SMS errors
- Use test numbers for bypass OTP

### 3. Token Not Stored
- Check browser localStorage
- Check network tab for API responses
- Verify token is returned in API response

### 4. Auto-logout on Refresh
- Check token verification in AuthContext
- Verify token is valid and not expired
- Check backend `/api/auth/me` endpoint

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Next Steps

1. Test all flows with real phone numbers (SMS)
2. Add email field to registration (optional)
3. Implement password reset flow
4. Add social login options
5. Implement refresh token mechanism

