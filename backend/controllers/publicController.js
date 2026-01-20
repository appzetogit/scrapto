import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Price from '../models/Price.js';
import logger from '../utils/logger.js';

// @desc    Get all active public prices
// @route   GET /api/public/prices
// @access  Public
export const getPublicPrices = asyncHandler(async (req, res) => {
    try {
        // Only fetch active prices
        // Get distinct categories first to avoid duplicates if multiple regions exist (simplification for now)
        // Or just get all active prices for default region (IN-DL) or all regions if specific query

        const filter = { isActive: true };
        if (req.query.regionCode) {
            filter.regionCode = req.query.regionCode;
        } else {
            // Default to IN-DL or just show all unique categories?
            // Let's default to 'IN-DL' to be consistent with default creation
            filter.regionCode = 'IN-DL';
        }

        const prices = await Price.find(filter)
            .select('category pricePerKg price type regionCode effectiveDate updatedAt image')
            .sort({ category: 1 });

        sendSuccess(res, 'Public prices retrieved successfully', { prices });
    } catch (error) {
        logger.error('[Public] Error fetching prices:', error);
        sendError(res, 'Failed to fetch prices', 500);
    }
});
