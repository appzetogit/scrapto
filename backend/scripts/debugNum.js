import mongoose from 'mongoose';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const debugNum = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const phone = '9876598765';
        
        const users = await User.find({ phone });
        console.log(`--- Users with phone ${phone} ---`);
        users.forEach(u => console.log(`ID: ${u._id}, Role: ${u.role}, Email: ${u.email}`));
        
        const scrappers = await Scrapper.find({ phone });
        console.log(`\n--- Scrappers with phone ${phone} ---`);
        scrappers.forEach(s => console.log(`ID: ${s._id}, Phone: ${s.phone}, Status: ${s.status}`));

        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};

debugNum();
