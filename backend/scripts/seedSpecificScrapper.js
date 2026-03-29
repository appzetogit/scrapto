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

const seedSpecificScrapper = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // New Scrapper credentials
        const phone = '8888855555';
        const email = 'scrapper888885@test.com';
        const name = 'New Scrapper Test';
        const password = 'scrapto@123';
        const role = 'scrapper';

        // Check if user already exists
        let user = await User.findOne({ phone });

        if (user) {
            console.log('⚠️  User already exists with phone:', phone);
            console.log('🗑️  Deleting existing user and scrapper profile...');
            await Scrapper.deleteOne({ _id: user._id });
            await User.deleteOne({ _id: user._id });
            console.log('✅ Deleted.');
        }

        console.log('🆕 Creating new scrapper user for 8888855555...');

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
            number: 'TEST-88-55',
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

        console.log('✅ Scrapper user created successfully!');
        console.log('   ID:', user._id);
        console.log('   Name:', user.name);
        console.log('   Phone:', user.phone);
        console.log('   Email:', user.email);
        console.log('\n📱 OTP for this number: 123456 (Bypass enabled)');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding scrapper:', error);
        process.exit(1);
    }
};

seedSpecificScrapper();
