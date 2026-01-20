# Admin Login Guide

## 🔐 Admin Authentication

**IMPORTANT:** Admin users use **password-based login** (NOT OTP-based login).

---

## 📝 Creating Admin User

### Using Script (Recommended):
```bash
cd backend
node scripts/createAdmin.js
```

### With Custom Credentials:
```bash
node scripts/createAdmin.js <email> <password> <name> <phone>
```

Example:
```bash
node scripts/createAdmin.js admin@scrapto.com Admin@123 "Admin User" 9999999999
```

### Default Credentials:
- **Email:** `admin@scrapto.com`
- **Password:** `Admin@123`
- **Name:** `Admin User`
- **Phone:** `9999999999`

---

## 🔑 Admin Login

### Endpoint:
```
POST /api/auth/login
```

### Request Body:
```json
{
  "email": "admin@scrapto.com",
  "password": "Admin@123"
}
```

### Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id_here",
      "name": "Admin User",
      "email": "admin@scrapto.com",
      "role": "admin",
      "isActive": true,
      "isVerified": true,
      "isPhoneVerified": true
    },
    "token": "jwt_token_here"
  }
}
```

### Using the Token:
After successful login, use the `token` in the Authorization header for all admin API calls:

```
Authorization: Bearer <token>
```

---

## ❌ What Admin Should NOT Use

Admin should **NOT** use OTP-based login endpoints:

- ❌ `POST /api/auth/login-otp` - OTP-based login (for users/scrappers)
- ❌ `POST /api/auth/verify-otp` - OTP verification (for users/scrappers)

These endpoints are for regular users and scrappers only. Admin must use password-based login.

---

## 🔒 Security Notes

1. **Password Hashing:** Passwords are automatically hashed using bcrypt before saving to database
2. **Token Expiry:** JWT tokens expire based on `JWT_EXPIRE` environment variable (default: 7 days)
3. **Role Verification:** All admin endpoints verify the user has `admin` role
4. **Active Status:** Admin account must be `isActive: true` to login

---

## 🛠️ Troubleshooting

### "Invalid credentials" Error:
- Check email and password are correct
- Ensure admin user exists in database
- Verify password was set correctly (use script to create admin)

### "Account is deactivated" Error:
- Admin account `isActive` field must be `true`
- Update in database: `db.users.updateOne({email: "admin@scrapto.com"}, {$set: {isActive: true}})`

### "Not authorized" Error on Admin Endpoints:
- Verify token is included in Authorization header
- Check token hasn't expired
- Ensure user role is `admin` in database

---

## 📋 Example: Complete Login Flow

### 1. Create Admin (One-time setup):
```bash
cd backend
node scripts/createAdmin.js
```

### 2. Login:
```bash
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@scrapto.com",
    "password": "Admin@123"
  }'
```

### 3. Use Token for Admin Endpoints:
```bash
curl -X GET http://localhost:7000/api/admin/dashboard/stats \
  -H "Authorization: Bearer <token_from_step_2>"
```

---

## ✅ Summary

- ✅ Admin uses: `POST /api/auth/login` with email + password
- ❌ Admin does NOT use: OTP-based login endpoints
- ✅ Token from login is used for all admin API calls
- ✅ All admin endpoints require `Authorization: Bearer <token>` header




