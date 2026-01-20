import Banner from '../models/Banner.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { uploadFile, deleteFile } from '../services/uploadService.js';
import logger from '../utils/logger.js';

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private (Admin)
export const createBanner = asyncHandler(async (req, res) => {
    const { title, link, targetAudience, displayOrder, isActive, startDate, endDate } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
        return sendError(res, 'Banner image is required', 400);
    }

    try {
        // Upload image to Cloudinary
        const result = await uploadFile(imageFile, { folder: 'banners' });

        const banner = await Banner.create({
            title,
            imageUrl: result.secure_url,
            link,
            targetAudience,
            displayOrder: displayOrder || 0,
            isActive: isActive === 'true' || isActive === true,
            startDate: startDate || null,
            endDate: endDate || null
        });

        sendSuccess(res, 'Banner created successfully', { banner }, 201);
    } catch (error) {
        logger.error('Error creating banner:', error);
        sendError(res, 'Failed to create banner', 500);
    }
});

// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin/all
// @access  Private (Admin)
export const getAllBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
    sendSuccess(res, 'All banners retrieved', { banners });
});

// @desc    Get active banners (Public/User/Scrapper)
// @route   GET /api/banners/public
// @access  Public
export const getActiveBanners = asyncHandler(async (req, res) => {
    const { audience } = req.query; // 'user' or 'scrapper'

    const query = {
        isActive: true
    };

    // Filter by audience if provided
    if (audience) {
        query.targetAudience = { $in: [audience, 'both'] };
    }

    // Filter by date validity if dates are set
    const now = new Date();
    query.$and = [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
    ];

    const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });

    sendSuccess(res, 'Banners retrieved', { banners });
});

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private (Admin)
export const updateBanner = asyncHandler(async (req, res) => {
    const { title, link, targetAudience, displayOrder, isActive, startDate, endDate } = req.body;
    const bannerId = req.params.id;

    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return sendError(res, 'Banner not found', 404);
    }

    // Handle image update if new file provided
    if (req.file) {
        try {
            // Create new image first
            const result = await uploadFile(req.file, { folder: 'banners' });
            banner.imageUrl = result.secure_url;
        } catch (error) {
            return sendError(res, 'Failed to upload new image', 500);
        }
    }

    if (title) banner.title = title;
    if (link !== undefined) banner.link = link;
    if (targetAudience) banner.targetAudience = targetAudience;
    if (displayOrder !== undefined) banner.displayOrder = displayOrder;
    if (isActive !== undefined) banner.isActive = isActive;
    if (startDate !== undefined) banner.startDate = startDate;
    if (endDate !== undefined) banner.endDate = endDate;

    await banner.save();

    sendSuccess(res, 'Banner updated successfully', { banner });
});

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
export const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        return sendError(res, 'Banner not found', 404);
    }

    // Optional: Delete image from Cloudinary (requires public_id storage logic which isn't fully implemented in simple version, skipping for safety or implementing if helper exists)
    // For now just deleting record

    await Banner.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'Banner deleted successfully');
});

// @desc    Toggle banner active status
// @route   PATCH /api/banners/:id/status
// @access  Private (Admin)
export const toggleBannerStatus = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        return sendError(res, 'Banner not found', 404);
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    sendSuccess(res, `Banner ${banner.isActive ? 'activated' : 'deactivated'}`, { banner });
});
