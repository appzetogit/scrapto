# Environment Setup Guide

## Quick Fix for JWT_SECRET Error

If you're getting the error: `secretOrPrivateKey must have a value`, you need to create a `.env` file in the `backend` folder.

## Steps to Fix

1. **Create `.env` file in `backend` folder:**
   ```bash
   cd backend
   ```

2. **Create a new file named `.env`** with the following content:

```env
# Server Configuration
NODE_ENV=development
PORT=7000
FRONTEND_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/scrapto

# JWT Configuration (REQUIRED)
JWT_SECRET=scrapto-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=scrapto-refresh-token-secret-change-this-in-production-2024
JWT_REFRESH_EXPIRE=30d

# SMSIndia Hub Configuration (Copy from createbharat/Backend/.env)
SMSINDIAHUB_API_KEY=your-smsindiahub-api-key
SMSINDIAHUB_SENDER_ID=your-smsindiahub-sender-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

3. **Copy SMSIndia Hub credentials from createbharat:**
   - Open `createbharat/Backend/.env`
   - Copy `SMSINDIAHUB_API_KEY` and `SMSINDIAHUB_SENDER_ID`
   - Paste them in `backend/.env`

4. **Restart your backend server:**
   ```bash
   npm run dev
   ```

## Important Notes

- The `.env` file is in `.gitignore` and won't be committed to git
- For production, use a strong, random JWT_SECRET
- Never share your `.env` file or commit it to version control
- The default JWT_SECRET in code is only for development and will show a warning

## Generate a Strong JWT Secret

You can generate a strong secret using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use an online generator: https://randomkeygen.com/

