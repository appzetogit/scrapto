/**
 * Simple script to test JWT token generation and verification
 * Run with: node test-jwt.js
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const DEFAULT_JWT_SECRET = 'scrapto-dev-secret-key-change-in-production-2024';
const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const secretSource = process.env.JWT_SECRET ? 'process.env.JWT_SECRET' : 'DEFAULT_JWT_SECRET';

console.log('\n🔍 JWT Secret Configuration Test\n');
console.log('='.repeat(50));
console.log(`Secret Source: ${secretSource}`);
console.log(`Secret Value: ${secret}`);
console.log(`Secret Length: ${secret.length}`);
console.log(`JWT_EXPIRE: ${process.env.JWT_EXPIRE || '7d'}`);
console.log('='.repeat(50));

// Test token generation
console.log('\n📝 Testing Token Generation...\n');
try {
  const testUserId = '507f1f77bcf86cd799439011';
  const testRole = 'user';
  
  const token = jwt.sign(
    { id: testUserId, role: testRole },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
  
  console.log('✅ Token generated successfully!');
  console.log(`Token Length: ${token.length}`);
  console.log(`Token Preview: ${token.substring(0, 50)}...`);
  
  // Test token verification
  console.log('\n🔐 Testing Token Verification...\n');
  try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verified successfully!');
    console.log('Decoded Token:', {
      userId: decoded.id,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (verifyError) {
    console.error('❌ Token verification failed!');
    console.error('Error:', verifyError.message);
    console.error('Error Name:', verifyError.name);
  }
  
  // Test with wrong secret (should fail)
  console.log('\n🚫 Testing with Wrong Secret (should fail)...\n');
  try {
    const wrongSecret = 'wrong-secret';
    jwt.verify(token, wrongSecret);
    console.error('❌ ERROR: Token verified with wrong secret! This should not happen!');
  } catch (wrongSecretError) {
    console.log('✅ Correctly rejected token with wrong secret');
    console.log('Error:', wrongSecretError.message);
  }
  
} catch (error) {
  console.error('❌ Token generation failed!');
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('\n💡 Tips:');
console.log('1. Make sure JWT_SECRET in .env matches what the server uses');
console.log('2. If you change JWT_SECRET, all existing tokens become invalid');
console.log('3. Restart the server after changing .env file');
console.log('4. Clear localStorage and login again after changing JWT_SECRET\n');






