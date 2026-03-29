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

const testScrappers = [
    {
        phone: '9999999990',
        email: 'scrapper999@test.com',
        name: 'Test Scrapper 999',
        password: 'scrapto@123',
        role: 'scrapper'
    },
    {
        phone: '8888888880',
        email: 'scrapper888@test.com',
        name: 'Test Scrapper 888',
        password: 'scrapto@123',
        role: 'scrapper'
    }
];

const seedTestScrappers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const data of testScrappers) {
            const { phone, email, name, password, role } = data;
            
            // Check if user already exists
            let user = await User.findOne({ phone });

            if (user) {
                console.log(`⚠️  User already exists with phone: ${phone}`);
                console.log(`🗑️  Deleting existing user and scrapper profile...`);
                await Scrapper.deleteOne({ _id: user._id });
                await User.deleteOne({ _id: user._id });
                console.log(`✅ Deleted.`);
            }

            console.log(`🆕 Creating new scrapper user for ${phone}...`);

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
                number: `TEST-${phone.slice(-4)}`,
                capacity: 100
            };

            await Scrapper.create({
                _id: user._id, 
                phone,
                name,
                email,
                vehicleInfo: defaultVehicleInfo,
                status: 'active',
                isPhoneVerified: true
            });

            console.log(`✅ Scrapper user created successfully for ${phone}!`);
        }

        console.log('\n🚀 ALL TEST SCRAPPERS SEEDED SUCCESSFULLY!');
        console.log('📱 OTP for these numbers: 123456 (Bypass enabled)');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding test scrappers:', error);
        process.exit(1);
    }
};

seedTestScrappers();
