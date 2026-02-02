
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const debugOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find order ending in 7CCCE0
        // ObjectId is 24 chars. 
        // We can't do regex on ObjectId directly in all versions, but we can fetch recent orders and check.

        // Efficient approach: $where (slow) or just fetching all completed orders (assuming few exists in dev).
        const orders = await Order.find({}).populate('scrapper');

        const targetOrder = orders.find(o => o._id.toString().toUpperCase().endsWith('7CCCE0'));

        if (targetOrder) {
            console.log('Found Target Order:', targetOrder._id);
            console.log('Status:', targetOrder.status);
            console.log('Scrapper Field:', targetOrder.scrapper);

            if (!targetOrder.scrapper) {
                const rawOrder = await Order.findById(targetOrder._id);
                console.log('Raw Scrapper ID:', rawOrder.scrapper);

                if (rawOrder.scrapper) {
                    const s = await Scrapper.findById(rawOrder.scrapper);
                    console.log('Scrapper Exists in DB?', !!s);
                }
            }
        } else {
            console.log('Target order 7CCCE0 not found. Listing recent orders:');
            orders.slice(0, 5).forEach(o => console.log(o._id.toString(), o.status));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugOrder();
