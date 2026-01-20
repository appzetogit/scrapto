import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'scrapto@scrapto.com';
    const adminPhone = '9999999999';
    const adminPassword = 'scrapto@123';
    const adminName = 'Scrapto Admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminEmail },
        { phone: adminPhone },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', existingAdmin.email);
      console.log('   Phone:', existingAdmin.phone);
      console.log('   Role:', existingAdmin.role);
      console.log('\n🔄 Updating existing admin with new credentials...');
      
      // Update existing admin
      existingAdmin.name = adminName;
      existingAdmin.email = adminEmail;
      existingAdmin.phone = adminPhone;
      existingAdmin.password = adminPassword; // Will be auto-hashed by pre-save hook
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      existingAdmin.isPhoneVerified = true;
      
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully!');
      console.log('   Email:', adminEmail);
      console.log('   Phone:', adminPhone);
      console.log('   Name:', adminName);
      console.log('   Role: admin');
      console.log('\n📝 Login credentials:');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('\n🔐 Admin uses PASSWORD-BASED login (not OTP)');
      console.log('   Login endpoint: POST /api/auth/login');
      console.log('   Body: { "email": "' + adminEmail + '", "password": "' + adminPassword + '" }');
      
      process.exit(0);
      return;
    }

    // Create new admin user
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword, // Will be auto-hashed by User model's pre-save hook
      role: 'admin',
      isActive: true,
      isVerified: true,
      isPhoneVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Phone:', admin.phone);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('\n📝 Login credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n🔐 Admin uses PASSWORD-BASED login (not OTP)');
    console.log('   Login endpoint: POST /api/auth/login');
    console.log('   Body: { "email": "' + adminEmail + '", "password": "' + adminPassword + '" }');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Email or phone already exists. Please use a different email/phone.');
    }
    process.exit(1);
  }
};

seedAdmin();




