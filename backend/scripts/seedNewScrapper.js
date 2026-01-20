import mongoose from 'mongoose';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedNewScrapper = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // New Scrapper credentials
        const phone = '8888888888';
        const email = 'scrapper88@test.com';
        const name = 'Test Scrapper 88';
        const password = 'scrapto@123';
        const role = 'scrapper';

        // Check if user already exists
        let user = await User.findOne({
            $or: [
                { email },
                { phone }
            ]
        });

        if (user) {
            console.log('⚠️  User already exists!');
            console.log('   Email:', user.email);
            console.log('   Phone:', user.phone);
            console.log('   Role:', user.role);

            // Remove existing scrapper/user to recreate cleanliness or just update?
            // For testing, let's delete and recreate to be sure it's fresh.
            console.log('🗑️  Deleting existing user and scrapper profile...');
            await Scrapper.deleteOne({ _id: user._id });
            await User.deleteOne({ _id: user._id });
            console.log('✅ Deleted.');
        }

        console.log('🆕 Creating new scrapper user...');

        // Create user
        user = await User.create({
            name,
            email,
            phone,
            password,
            role,
            isActive: true,
            isVerified: true,
            isPhoneVerified: true
        });

        // Create scrapper profile
        const defaultVehicleInfo = {
            type: 'bike',
            number: 'MP-09-AB-1234',
            capacity: 100
        };

        const scrapper = await Scrapper.create({
            _id: user._id, // Link to User ID
            phone,
            name,
            email,
            vehicleInfo: defaultVehicleInfo,
            status: 'active'
        });

        console.log('✅ Scrapper user created successfully!');
        console.log('   ID:', user._id);
        console.log('   Name:', user.name);
        console.log('   Phone:', user.phone);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('\n📱 OTP for this number: 123456 (Bypass enabled)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding scrapper:', error);
        process.exit(1);
    }
};

seedNewScrapper();
