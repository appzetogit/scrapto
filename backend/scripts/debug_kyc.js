
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Scrapper from '../models/Scrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();
    console.log("Running query...");
    try {
        const scrappers = await Scrapper.find({})
            .select('name phone email kyc subscription status totalPickups earnings rating createdAt vehicleInfo +kyc.aadhaarNumber')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        console.log("Query success!");
        if (scrappers.length > 0) {
            console.log("First scrapper kyc:", scrappers[0].kyc);
        } else {
            console.log("No scrappers found");
        }
    } catch (error) {
        console.error("Query failed:", error);
    }
    process.exit();
};

run();
