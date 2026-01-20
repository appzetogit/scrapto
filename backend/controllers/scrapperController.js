import Scrapper from '../models/Scrapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const getMyProfile = asyncHandler(async (req, res) => {
    const scrapper = await Scrapper.findById(req.user._id);

    if (!scrapper) {
        // Should not happen if data integrity is maintained, but possible if manually deleted
        return sendError(res, 'Scrapper profile not found', 404);
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
