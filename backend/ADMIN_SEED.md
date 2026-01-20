# Admin User Seed Script

## Overview
This script creates/updates an admin user in MongoDB with predefined credentials.

## Admin Credentials

- **Email:** `scrapto@scrapto.com`
- **Password:** `scrapto@123`
- **Phone:** `9999999999`
- **Name:** `Scrapto Admin`
- **Role:** `admin`

## Usage

### Run the seed script:
```bash
cd backend
npm run seed:admin
```

Or directly:
```bash
node scripts/seedAdmin.js
```

## What It Does

1. **Connects to MongoDB** using `MONGODB_URI` from `.env`
2. **Checks if admin exists:**
   - If admin exists → Updates with new credentials
   - If admin doesn't exist → Creates new admin user
3. **Auto-hashes password** using User model's pre-save hook
4. **Sets required flags:**
   - `isActive: true`
   - `isVerified: true`
   - `isPhoneVerified: true`
   - `role: 'admin'`

## Login

After seeding, use these credentials to login:

**Endpoint:**
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "scrapto@scrapto.com",
  "password": "scrapto@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Scrapto Admin",
      "email": "scrapto@scrapto.com",
      "role": "admin",
      ...
    },
    "token": "jwt_token_here"
  }
}
```

## Important Notes

1. **Password-based login only:** Admin uses password-based login (NOT OTP-based)
2. **Password auto-hashing:** Password is automatically hashed by User model
3. **Update existing:** If admin already exists, script will update it with new credentials
4. **Environment:** Make sure `MONGODB_URI` is set in `backend/.env`

## Troubleshooting

### "MONGODB_URI not set"
- Add `MONGODB_URI=mongodb://localhost:27017/scrapto` to `backend/.env`

### "Email or phone already exists"
- Script will update existing admin instead of creating new one
- This is expected behavior

### "Connection refused"
- Make sure MongoDB is running
- Check `MONGODB_URI` is correct




