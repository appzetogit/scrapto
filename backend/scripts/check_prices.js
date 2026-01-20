
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Price from '../models/Price.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkPrices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const prices = await Price.find({ regionCode: 'IN-DL', isActive: true });
        console.log(`Found ${prices.length} active prices for IN-DL`);

        if (prices.length > 0) {
            console.log('Sample price:', JSON.stringify(prices[0], null, 2));
        } else {
            console.log('❌ No prices found for IN-DL. Checking all prices...');
            const allPrices = await Price.find({});
            console.log(`Total prices in DB: ${allPrices.length}`);
            if (allPrices.length > 0) {
                console.log('Sample price from DB:', JSON.stringify(allPrices[0], null, 2));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkPrices();
