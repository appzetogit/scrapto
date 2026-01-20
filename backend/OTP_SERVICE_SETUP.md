# OTP Service Setup Guide

This document explains how to set up the OTP service using SMSIndia Hub, using the same credentials as CreateBharat project.

## Overview

The OTP service is fully implemented and matches the CreateBharat implementation exactly. It includes:

- SMSIndia Hub service integration
- OTP generation and verification
- Phone number verification
- Bypass OTP for test numbers
- Login via OTP
- Resend OTP functionality

## Setup Instructions

### 1. Get SMSIndia Hub Credentials from CreateBharat

Copy the SMSIndia Hub credentials from `createbharat/Backend/.env`:

```env
SMSINDIAHUB_API_KEY=your-api-key-from-createbharat
SMSINDIAHUB_SENDER_ID=your-sender-id-from-createbharat
```

### 2. Add to Your .env File

Create a `.env` file in the `backend` folder (if not exists) and add:

```env
# SMSIndia Hub Configuration (Same credentials as CreateBharat)
SMSINDIAHUB_API_KEY=your-api-key-from-createbharat
SMSINDIAHUB_SENDER_ID=your-sender-id-from-createbharat
```

### 3. Install Dependencies

Make sure `axios` is installed:

```bash
npm install
```

## API Endpoints

### 1. Register User (with OTP)
**POST** `/api/auth/register`

Sends OTP automatically after registration.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your phone number with OTP.",
  "data": {
    "user": {...},
    "token": "jwt-token",
    "otpSent": true
  }
}
```

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

**Request:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "purpose": "verification" // optional: "login" or "verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {...},
    "token": "jwt-token" // if purpose is "login"
  }
}
```

### 3. Resend OTP
**POST** `/api/auth/resend-otp`

**Request:**
```json
{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "otpSent": true
  }
}
```

### 4. Send Login OTP
**POST** `/api/auth/login-otp`

**Request:**
```json
{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login OTP sent successfully",
  "data": {
    "otpSent": true
  }
}
```

## Test Numbers (Bypass OTP)

The following phone numbers use fixed OTPs for testing (same as CreateBharat):

- `7610416911` → OTP: `110211`
- `9685974247`, `9876543210`, `9999999999` → OTP: `123456`

These numbers bypass SMS sending and use fixed OTPs.

## Features

### 1. Automatic OTP on Registration
When a user registers, an OTP is automatically generated and sent via SMS.

### 2. OTP Expiration
OTPs expire after 10 minutes.

### 3. Development Mode
In development mode (`NODE_ENV=development`), if SMS fails, registration/login still works and OTP is logged to console.

### 4. Production Mode
In production mode, if SMS fails, the request returns an error.

### 5. Phone Verification
After OTP verification, `isPhoneVerified` and `isVerified` are set to `true`.

## User Model Changes

The User model now includes:
- `phoneVerificationOTP`: Stores the OTP
- `otpExpiresAt`: OTP expiration timestamp
- `isPhoneVerified`: Phone verification status

**Methods:**
- `generateOTP()`: Generates a 6-digit OTP
- `verifyOTP(otp)`: Verifies the provided OTP

## Files Created/Modified

### New Files:
- `backend/services/smsIndiaHubService.js` - SMSIndia Hub service
- `backend/utils/otpService.js` - OTP utility functions

### Modified Files:
- `backend/models/User.js` - Added OTP fields and methods
- `backend/controllers/authController.js` - Added OTP endpoints
- `backend/routes/authRoutes.js` - Added OTP routes
- `backend/validators/authValidator.js` - Added OTP validators
- `backend/package.json` - Added axios dependency

## Testing

1. **Register a new user:**
   ```bash
   POST /api/auth/register
   ```

2. **Verify OTP:**
   ```bash
   POST /api/auth/verify-otp
   ```

3. **Test with bypass number:**
   Use phone `7610416911` with OTP `110211`

## Notes

- OTPs are 6-digit numeric codes
- OTPs expire after 10 minutes
- Same SMSIndia Hub credentials as CreateBharat
- Same bypass numbers and logic as CreateBharat
- Same message template format as CreateBharat

## Troubleshooting

1. **SMS not sending:**
   - Check SMSIndia Hub credentials in `.env`
   - Check SMSIndia Hub account balance
   - Verify phone number format (10 digits)

2. **OTP verification failing:**
   - Check if OTP has expired (10 minutes)
   - Verify correct phone number
   - Check server logs for OTP values

3. **Development mode:**
   - OTP is logged to console if SMS fails
   - Registration/login still works in development

