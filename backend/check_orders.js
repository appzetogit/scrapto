
import mongoose from 'mongoose';
import Order from './models/Order.js'; // Adjust path if needed
import { connectDB } from './config/database.js'; // Adjust path
import { ORDER_STATUS } from './config/constants.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected');

        const pendingOrders = await Order.find({
            status: 'pending',
            assignmentStatus: 'unassigned'
        });

        console.log(`\n--- Order Summary ---`);
        console.log(`Total Pending & Unassigned Orders: ${pendingOrders.length}`);

        if (pendingOrders.length > 0) {
            console.log('\nPreview of Pending Orders:');
            pendingOrders.forEach(o => {
                console.log(`- ID: ${o._id}, User: ${o.user}, CreatedAt: ${o.createdAt}`);
            });
        } else {
            console.log('No pending orders found. Scrappers will see an empty list.');
        }

        const totalOrders = await Order.countDocuments();
        console.log(`\nTotal Orders in DB: ${totalOrders}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkOrders();
