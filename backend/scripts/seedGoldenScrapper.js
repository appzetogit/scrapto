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

const seedGoldenScrapper = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Golden Scrapper credentials
        const phone = '9876598765';
        const email = 'scrapper987659@test.com';
        const name = 'Golden Scrapper';
        const password = 'scrapto@123';
        const role = 'scrapper';

        // Check if user already exists
        let user = await User.findOne({ $or: [{ phone }, { email }] });

        if (user) {
            console.log('⚠️  User already exists with phone:', user.phone, 'or email:', user.email);
            console.log('🗑️  Deleting existing user and scrapper profile...');
            await Scrapper.deleteOne({ _id: user._id });
            await User.deleteOne({ _id: user._id });
            console.log('✅ Deleted.');
        }

        console.log('🆕 Creating new golden scrapper user for 9876598765...');

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
            number: 'GOLD-98-76',
            capacity: 100
        };

        const scrapper = await Scrapper.create({
            _id: user._id, 
            phone,
            name,
            email,
            vehicleInfo: defaultVehicleInfo,
            status: 'active',
            isPhoneVerified: true
        });

        console.log('✅ Golden Scrapper user created successfully!');
        console.log('   ID:', user._id);
        console.log('   Phone:', user.phone);
        console.log('\n📱 OTP for this number: 123456 (Always Bypass enabled)');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding golden scrapper:', error);
        process.exit(1);
    }
};

seedGoldenScrapper();
