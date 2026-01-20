# Scrapper Test Numbers & OTP

## Overview
Scrapper accounts ke liye dedicated test phone numbers aur OTP set kiye gaye hain taaki testing ke dauran baar-baar OTP SMS requests na jayein.

## Scrapper Test Numbers

### Default Scrapper Test Numbers:
- **8888888888** - OTP: `123456`
- **7777777777** - OTP: `123456`
- **6666666666** - OTP: `123456`

### User Test Numbers (existing):
- **7610416911** - OTP: `110211`
- **6260491554** - OTP: `123456`
- **9685974247** - OTP: `123456`
- **9876543210** - OTP: `123456`
- **9999999999** - OTP: `123456`

## How It Works

1. **Registration**: Jab koi scrapper in numbers se register karta hai, system automatically `123456` OTP set kar deta hai (SMS send nahi hota)

2. **Login**: Jab scrapper login karta hai, same `123456` OTP use hota hai

3. **OTP Verification**: User ko sirf `123456` enter karna hota hai, SMS ki zarurat nahi

## Configuration

Bypass OTP functionality automatically enabled hai development mode mein. Production mein disable ho jata hai.

Environment variable: `ENABLE_BYPASS_OTP` (default: enabled in development)

## Testing Steps

1. Scrapper registration:
   - Phone: `8888888888`
   - OTP: `123456`

2. Scrapper login:
   - Phone: `8888888888`
   - OTP: `123456`

## Notes

- Ye numbers sirf testing ke liye hain
- Production mein SMS service use hogi
- Har test number ka apna fixed OTP hai jo change nahi hota





