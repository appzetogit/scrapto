import Scrapper from '../models/Scrapper.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

export const getMyProfile = asyncHandler(async (req, res) => {
    let scrapper = await Scrapper.findById(req.user.id);

    // Auto-provision if missing
    if (!scrapper) {
        logger.info(`Scrapper profile missing for user ${req.user.id}, auto-provisioning...`);

        // Ensure we have phone/email from user
        // req.user might be partial depending on middleware, safe to fetch fresh
        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'scrapper') {
            return sendError(res, 'Scrapper user not found', 404);
        }

        scrapper = await Scrapper.create({
            _id: user._id,
            phone: user.phone,
            name: user.name || 'Scrapper',
            email: user.email,
            vehicleInfo: { type: 'bike', number: 'NA', capacity: 0 }
        });

        logger.info(`Auto-provisioned scrapper profile: ${scrapper._id}`);
    }

    sendSuccess(res, 'Scrapper profile fetched successfully', { scrapper });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
    const { name, vehicleInfo, availability } = req.body;

    const scrapper = await Scrapper.findById(req.user._id);
    if (!scrapper) {
        return sendError(res, 'Scrapper profile not found', 404);
    }

    if (name) scrapper.name = name;
    if (vehicleInfo) scrapper.vehicleInfo = { ...scrapper.vehicleInfo, ...vehicleInfo };
    // Add other fields as needed

    await scrapper.save();
    sendSuccess(res, 'Profile updated successfully', { scrapper });
});

export const getScrapperPublicProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const scrapper = await Scrapper.findById(id).select('-earnings -kyc.aadhaarNumber');

    if (!scrapper) {
        return sendError(res, 'Scrapper not found', 404);
    }

    sendSuccess(res, 'Scrapper fetched successfully', { scrapper });
});
