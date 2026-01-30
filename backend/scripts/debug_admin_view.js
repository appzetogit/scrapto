
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
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();
    console.log("Running getScrapperById simulation...");

    // Find a scrapper with KYC
    const scrapper = await Scrapper.findOne({ 'kyc.aadhaarNumber': { $exists: true, $ne: null } })
        .select('+kyc.aadhaarNumber');

    if (!scrapper) {
        console.log("No scrapper with Aadhaar found.");
        process.exit();
    }

    console.log("Found Scrapper ID:", scrapper._id);
    console.log("Raw Document Aadhaar:", scrapper.kyc?.aadhaarNumber);

    const pojo = scrapper.toObject();
    console.log("toObject() Aadhaar:", pojo.kyc?.aadhaarNumber);

    const json = scrapper.toJSON();
    console.log("toJSON() Aadhaar:", json.kyc?.aadhaarNumber);

    process.exit();
};

run();
