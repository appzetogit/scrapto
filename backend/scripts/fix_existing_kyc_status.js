import mongoose from 'mongoose';
import Scrapper from '../models/Scrapper.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const fixKYCStatus = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all scrappers with kyc.status: 'pending' but NO aadhaarPhotoUrl
        const scrappersToFix = await Scrapper.find({
            'kyc.status': 'pending',
            $or: [
                { 'kyc.aadhaarPhotoUrl': null },
                { 'kyc.aadhaarPhotoUrl': '' },
                { 'kyc.aadhaarNumber': { $exists: false } }
            ]
        });

        console.log(`🔍 Found ${scrappersToFix.length} scrappers with incomplete KYC records that were marked as 'pending'.`);

        if (scrappersToFix.length > 0) {
            console.log('🔄 Updating statuses to \'not_submitted\'...');
            
            const results = await Scrapper.updateMany(
                {
                    _id: { $in: scrappersToFix.map(s => s._id) }
                },
                {
                    $set: { 'kyc.status': 'not_submitted' }
                }
            );

            console.log(`✅ Successfully updated ${results.modifiedCount} scrapper records.`);
        } else {
            console.log('✨ No records found that need fixing.');
        }

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing KYC status:', error);
        process.exit(1);
    }
};

fixKYCStatus();
