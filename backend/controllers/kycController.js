import Scrapper from '../models/Scrapper.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { deleteFile as deleteFromCloudinary, uploadFile } from '../services/uploadService.js';
import logger from '../utils/logger.js';

// @desc Submit or update KYC
// @route POST /api/kyc
// @access Private (Scrapper)
export const submitKyc = async (req, res) => {
  try {
    // req.user.id comes from JWT and typically points to User collection (role: 'scrapper')
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'scrapper') {
      return sendError(res, 'Scrapper user not found', 404);
    }

    // Try to find scrapper profile (support both legacy id-link and phone-link)
    let scrapper = await Scrapper.findById(userId);
    if (!scrapper && user.phone) {
      scrapper = await Scrapper.findOne({ phone: user.phone });
    }

    // Auto-provision scrapper profile if missing (for existing scrapper users)
    if (!scrapper) {
      const defaultVehicleInfo = {
        type: 'bike',
        number: 'NA',
        capacity: 0
      };

      scrapper = await Scrapper.create({
        _id: user._id,
        phone: user.phone,
        name: user.name || 'Scrapper',
        email: user.email || null,
        vehicleInfo: defaultVehicleInfo
      });

      logger.info('✅ Auto-created scrapper profile during KYC submit:', {
        userId: user._id,
        phone: user.phone
      });
    }

    const { aadhaarNumber } = req.body;

    // Collect uploaded file objects from Multer
    const files = req.files || {};
    const getFirst = (field) => (files[field]?.[0] ? files[field][0] : null);

    const aadhaarFile = getFirst('aadhaar');
    const selfieFile = getFirst('selfie');
    const licenseFile = getFirst('license');

    // Update KYC fields
    if (aadhaarNumber) scrapper.kyc.aadhaarNumber = aadhaarNumber;

    // Upload files to Cloudinary and update URLs
    if (aadhaarFile) {
      const result = await uploadFile(aadhaarFile, { folder: 'kyc/aadhaar' });
      scrapper.kyc.aadhaarPhotoUrl = result.secure_url;
    }

    if (selfieFile) {
      const result = await uploadFile(selfieFile, { folder: 'kyc/selfie' });
      scrapper.kyc.selfieUrl = result.secure_url;
    }

    if (licenseFile) {
      const result = await uploadFile(licenseFile, { folder: 'kyc/license' });
      scrapper.kyc.licenseUrl = result.secure_url;
    }

    scrapper.kyc.status = 'pending';
    scrapper.kyc.verifiedAt = null;
    scrapper.kyc.verifiedBy = null;
    scrapper.kyc.rejectionReason = null;

    await scrapper.save();

    return sendSuccess(res, 'KYC submitted successfully', { kyc: scrapper.kyc }, 201);
  } catch (error) {
    logger.error('KYC submission error:', error);
    return sendError(res, 'Failed to submit KYC', 500);
  }
};

// @desc Get own KYC status
// @route GET /api/kyc/me
// @access Private (Scrapper)
export const getMyKyc = async (req, res) => {
  // req.user.id typically refers to User document (role: 'scrapper')
  const user = await User.findById(req.user.id);

  if (!user || user.role !== 'scrapper') {
    return sendError(res, 'Scrapper user not found', 404);
  }

  // Try legacy lookup by id first, then by phone
  let scrapper = await Scrapper.findById(user._id).select('kyc subscription');
  if (!scrapper && user.phone) {
    scrapper = await Scrapper.findOne({ phone: user.phone }).select('kyc subscription');
  }

  // Auto-provision scrapper profile if missing
  if (!scrapper) {
    const defaultVehicleInfo = {
      type: 'bike',
      number: 'NA',
      capacity: 0
    };

    scrapper = await Scrapper.create({
      _id: user._id,
      phone: user.phone,
      name: user.name || 'Scrapper',
      email: user.email || null,
      vehicleInfo: defaultVehicleInfo
    });

    logger.info('✅ Auto-created scrapper profile during KYC fetch:', {
      userId: user._id,
      phone: user.phone
    });
  }

  return sendSuccess(res, 'KYC status retrieved', {
    kyc: scrapper.kyc,
    subscription: scrapper.subscription
  });
};

// @desc Admin verify KYC
// @route POST /api/kyc/:id/verify
// @access Private (Admin)
export const verifyKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const scrapper = await Scrapper.findById(id);
    if (!scrapper) return sendError(res, 'Scrapper not found', 404);

    scrapper.kyc.status = 'verified';
    scrapper.kyc.verifiedAt = new Date();
    scrapper.kyc.verifiedBy = req.user.id;
    scrapper.kyc.rejectionReason = null;
    await scrapper.save();

    return sendSuccess(res, 'KYC verified', { kyc: scrapper.kyc });
  } catch (error) {
    logger.error('KYC verification error:', error);
    return sendError(res, 'Failed to verify KYC', 500);
  }
};

// @desc Admin reject KYC
// @route POST /api/kyc/:id/reject
// @access Private (Admin)
export const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const scrapper = await Scrapper.findById(id);
    if (!scrapper) return sendError(res, 'Scrapper not found', 404);

    scrapper.kyc.status = 'rejected';
    scrapper.kyc.rejectionReason = reason || 'Not specified';
    scrapper.kyc.verifiedAt = null;
    scrapper.kyc.verifiedBy = req.user.id;
    await scrapper.save();

    return sendSuccess(res, 'KYC rejected', { kyc: scrapper.kyc });
  } catch (error) {
    logger.error('KYC rejection error:', error);
    return sendError(res, 'Failed to reject KYC', 500);
  }
};

// @desc Admin get all scrappers with KYC status
// @route GET /api/kyc/scrappers
// @access Private (Admin)
export const getAllScrappersWithKyc = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      query['kyc.status'] = status;
    }

    // Get scrappers with KYC info
    const scrappers = await Scrapper.find(query)
      .select('name phone email kyc subscription status totalPickups earnings rating createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Scrapper.countDocuments(query);

    return sendSuccess(res, 'Scrappers retrieved', {
      scrappers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get scrappers with KYC error:', error);
    return sendError(res, 'Failed to retrieve scrappers', 500);
  }
};



