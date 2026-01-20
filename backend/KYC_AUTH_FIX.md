# KYC Authentication Fix

**Issue:** Scrapper login ke baad bhi KYC submit karte waqt "User role 'user' is not authorized" error aa raha tha.

## Root Cause

1. **Token me wrong role:** `verifyOTP` function me user find karte waqt role check nahi ho raha tha
2. **User find without role filter:** Agar same phone se user aur scrapper dono exist karte, to wrong user mil sakta tha

## Fix Applied

### Backend (`controllers/authController.js`):

**Before:**
```javascript
const user = await User.findOne({ phone });
```

**After:**
```javascript
// Find user by phone, but if role is specified, also filter by role
let user;
if (requestedRole) {
  user = await User.findOne({ phone, role: requestedRole });
} else {
  user = await User.findOne({ phone });
}

// Additional check: if role was specified, ensure user role matches
if (requestedRole && user.role !== requestedRole) {
  return sendError(res, `Role mismatch. Expected ${requestedRole}, but user has role ${user.role}`, 400);
}
```

### Frontend (`modules/shared/utils/api.js`):

Added debug logging for KYC endpoints to track token issues:
```javascript
if (endpoint.includes('/uploads/') || endpoint.includes('/auth/me') || endpoint.includes('/kyc')) {
  console.log('🔍 API Request Debug:', {
    endpoint,
    hasToken: !!token,
    hasAuthHeader: !!config.headers.Authorization,
    isFormData: isFormData,
    method: config.method || 'GET'
  });
}
```

## How It Works Now

1. Scrapper login karta hai with `role: 'scrapper'`
2. `verifyOTP` me `requestedRole: 'scrapper'` pass hota hai
3. Backend ab `User.findOne({ phone, role: 'scrapper' })` karta hai
4. Token generate hota hai with correct role: `generateToken(user._id, user.role)`
5. Token me role 'scrapper' hota hai
6. KYC submit karte waqt token properly sent hota hai
7. Backend token verify karta hai aur role 'scrapper' check karta hai
8. KYC submit successful ✅

## Testing

1. Scrapper login karo
2. KYC documents upload karo
3. Submit karo
4. Should work without "User role 'user' is not authorized" error

## Additional Notes

- Token generation already correct hai (`generateToken(user._id, user.role)`)
- Issue sirf user finding me tha - ab role ke saath find karta hai
- FormData requests me token properly attach ho raha hai (apiRequest function handles it)





