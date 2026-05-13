import MarketplaceRequest from '../models/MarketplaceRequest.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { SCRAP_CATEGORIES } from '../config/constants.js';
import logger from '../utils/logger.js';
import { uploadMultipleFiles } from '../services/uploadService.js';
import { notifyUser } from '../services/socketService.js';

/**
 * @desc    Upload images for marketplace requests
 * @route   POST /api/v1/marketplace/upload
 * @access  Admin
 */
export const uploadMarketplaceImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return sendError(res, 'No files uploaded', 400);
  }

  const uploadResults = await uploadMultipleFiles(req.files, {
    folder: 'marketplace_requests'
  });

  const images = uploadResults.map(result => ({
    url: result.secure_url,
    publicId: result.public_id
  }));

  sendSuccess(res, 'Images uploaded successfully', images);
});
/**
 * @desc    Create marketplace requests
 * @route   POST /api/v1/marketplace/requests
 * @access  Admin
 */
export const createMarketplaceRequests = asyncHandler(async (req, res) => {
  const requestsData = Array.isArray(req.body) ? req.body : [req.body];
  
  if (requestsData.length === 0) {
    return sendError(res, 'Please provide request data', 400);
  }

  // Process and normalize data
  const processedData = [];
  
  for (const reqData of requestsData) {
    const normalized = { 
      ...reqData, 
      adminId: req.user.id,
      customerName: reqData.name || 'Customer'
    };

    // Find user by phone or create a new one (Auto-registration)
    if (reqData.phoneNumber) {
      let user = await User.findOne({ phone: reqData.phoneNumber });
      
      if (!user) {
        // Create a new user automatically so they can login via OTP later
        try {
          const crypto = await import('crypto');
          const tempPassword = crypto.randomBytes(16).toString('hex');
          const tempEmail = `${reqData.phoneNumber}@scrapto.auto`;
          
          user = await User.create({
            name: reqData.name || 'Scrapto User',
            phone: reqData.phoneNumber,
            email: tempEmail,
            password: tempPassword,
            role: 'user',
            isPhoneVerified: false,
            isVerified: false
          });
          
          logger.info(`✅ Auto-registered new user for marketplace request: ${reqData.phoneNumber}`);
        } catch (createError) {
          logger.error('❌ Failed to auto-register user:', createError.message);
          // Continue anyway, request will have userId: null
        }
      }

      if (user) {
        normalized.userId = user._id;
      }
    }

    // Map flat city/state to location object if location doesn't exist
    if (!normalized.location && (normalized.city || normalized.state)) {
      normalized.location = {
        city: normalized.city || '',
        state: normalized.state || ''
      };
      // Clean up flat fields
      delete normalized.city;
      delete normalized.state;
    }

    // Normalize images (if strings, convert to objects)
    if (normalized.images && Array.isArray(normalized.images)) {
      normalized.images = normalized.images.map(img => 
        typeof img === 'string' ? { url: img } : img
      );
    } else if (normalized.images && typeof normalized.images === 'string') {
      normalized.images = [{ url: normalized.images }];
    }

    // Normalize category to lowercase and validate against SCRAP_CATEGORIES
    if (normalized.category) {
      const categoryLower = normalized.category.toLowerCase();
      const validCategories = Object.values(SCRAP_CATEGORIES);
      
      if (validCategories.includes(categoryLower)) {
        normalized.category = categoryLower;
      } else {
        // Fallback to 'other' if category is invalid
        normalized.category = 'other';
        logger.warn(`[Marketplace] Invalid category "${reqData.category}" changed to "other"`);
      }
    } else {
      normalized.category = 'other';
    }

    processedData.push(normalized);
  }

  const requests = await MarketplaceRequest.insertMany(processedData);

  sendSuccess(res, 'Marketplace requests created successfully', requests, 201);
});

/**
 * @desc    Get all open marketplace requests
 * @route   GET /api/v1/marketplace/requests
 * @access  Scrapper, Admin
 */
export const getMarketplaceRequests = asyncHandler(async (req, res) => {
  const { city, category, status } = req.query;
  const scrapperId = req.user.id;

  // If scrapper, check subscription status and limits, and enforce city filter
  let maxRequests = null;
  if (req.user.role === 'scrapper') {
    const Scrapper = (await import('../models/Scrapper.js')).default;
    const scrapper = await Scrapper.findById(scrapperId).populate('subscription.planId');
    
    const sub = scrapper?.subscription;
    const isPlatformActive = (sub?.status === 'active' || sub?.status === 'cancelled') && new Date(sub.expiryDate) > new Date();

    // We no longer block the list view; restriction will happen at the details level
    // and by masking sensitive info.
    /*
    if (!isPlatformActive) {
      return sendError(res, 'Active subscription required to view marketplace', 403);
    }
    */

    maxRequests = sub.planId?.maxMarketplaceRequests ?? null;

    // Build query and enforce city filter
    const query = {};
    // Always only show 'open' requests to scrappers
    query.status = 'open';
    if (category) query.category = category;

    // STRICT city filter: scrapper only sees their own city
    if (scrapper.city) {
      query['location.city'] = new RegExp(`^${scrapper.city}$`, 'i');
    }
    // If scrapper has no city set, show all (backward compatible for existing scrappers)

    let dbQuery = MarketplaceRequest.find(query)
      .sort({ createdAt: -1 });

    if (maxRequests !== null) {
      dbQuery = dbQuery.limit(maxRequests);
    }

    const requests = await dbQuery;
    return sendSuccess(res, 'Marketplace requests retrieved successfully', requests);
  }
  
  // Admin path: no city or subscription restrictions
  const query = {};
  if (status) {
    query.status = status;
  }
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (category) query.category = category;

  const requests = await MarketplaceRequest.find(query)
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Marketplace requests retrieved successfully', requests);
});

/**
 * @desc    Get specific marketplace request details
 * @route   GET /api/v1/marketplace/requests/:id
 * @access  Scrapper, Admin, User
 */
export const getMarketplaceRequestById = asyncHandler(async (req, res) => {
  const request = await MarketplaceRequest.findById(req.params.id);

  if (!request) {
    return sendError(res, 'Request not found', 404);
  }

  // Privacy logic: Show address if scrapper has active subscription, is admin, or is the winner
  let hasActiveSubscription = false;
  if (req.user.role === 'scrapper') {
    const Scrapper = (await import('../models/Scrapper.js')).default;
    const scrapper = await Scrapper.findById(req.user.id);
    const sub = scrapper?.subscription;
    hasActiveSubscription = (sub?.status === 'active' || sub?.status === 'cancelled') && new Date(sub.expiryDate) > new Date();
  }

  const isAuthorized = 
    req.user.role === 'admin' || 
    hasActiveSubscription ||
    (request.status === 'deal_closed' && request.winnerScrapper?.toString() === (req.user.scrapperId || req.user.id)?.toString());

  const data = request.toObject();
  if (!isAuthorized) {
    delete data.fullAddress;
    delete data.phoneNumber;
  }

  // Check if the current scrapper has already placed a bid
  if (req.user.role === 'scrapper') {
    const scrapperId = req.user.scrapperId || req.user.id;
    const myBid = await Bid.findOne({ requestId: req.params.id, scrapperId });
    data.myBid = myBid;
  }

  sendSuccess(res, 'Marketplace request details retrieved successfully', data);
});

/**
 * @desc    Place a bid on a request
 * @route   POST /api/v1/marketplace/requests/:id/bids
 * @access  Scrapper
 */
export const placeBid = asyncHandler(async (req, res) => {
  const { bidAmount, message } = req.body;
  const requestId = req.params.id;

  const request = await MarketplaceRequest.findById(requestId);
  if (!request) return sendError(res, 'Request not found', 404);
  
  if (request.status !== 'open' && request.status !== 'bidding') {
    return sendError(res, 'Bidding is closed for this request', 400);
  }

  // Check if scrapper already has a bid
  const scrapperId = req.user.scrapperId || req.user.id;
  let bid = await Bid.findOne({ requestId, scrapperId });

  if (bid) {
    // Update existing bid
    bid.bidAmount = bidAmount;
    bid.message = message;
    await bid.save();
  } else {
    // Create new bid
    bid = await Bid.create({
      requestId,
      scrapperId,
      bidAmount,
      message
    });

    // Update request status to 'bidding' if it was 'open'
    if (request.status === 'open') {
      request.status = 'bidding';
      await request.save();
    }
  }

  // Send Notifications
  const bidAmountFormatted = `₹${bidAmount}`;
  const notificationTitle = 'New Bid Received';
  const notificationMessage = `A scrapper has placed a bid of ${bidAmountFormatted} on your marketplace request: ${request.title}`;

  // 1. Notify Admin
  if (request.adminId) {
    sendNotificationToUser(request.adminId.toString(), {
      title: 'New Bid Received 🎯',
      body: `A scrapper has placed a bid of ${bidAmountFormatted} on "${request.title}"`,
      data: {
        requestId: request._id.toString(),
        type: 'new_bid'
      }
    });
  }

  // 2. Notify User (if linked)
  if (request.userId && request.userId.toString() !== request.adminId?.toString()) {
    sendNotificationToUser(request.userId.toString(), {
      title: 'New Bid Received 🎯',
      body: `A scrapper has placed a bid of ${bidAmountFormatted} on your request: ${request.title}`,
      data: {
        requestId: request._id.toString(),
        type: 'new_bid'
      }
    });
  }

  sendSuccess(res, 'Bid placed successfully', bid);
});

/**
 * @desc    Accept a bid and close the deal
 * @route   PATCH /api/v1/marketplace/bids/:bidId/accept
 * @access  Admin, User
 */
export const acceptBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.bidId).populate('requestId');
  
  if (!bid) return sendError(res, 'Bid not found', 404);
  
  const request = bid.requestId;
  if (request.status === 'deal_closed') {
    return sendError(res, 'Deal is already closed for this request', 400);
  }

  // Close the deal
  request.status = 'deal_closed';
  request.winnerScrapper = bid.scrapperId;
  request.isDataDisclosed = true;
  request.dealClosedAt = new Date();
  await request.save();

  // Update bid status
  bid.status = 'accepted';
  await bid.save();

  // Reject all other bids for this request
  await Bid.updateMany(
    { requestId: request._id, _id: { $ne: bid._id } },
    { status: 'rejected' }
  );

  // Send Notification to Scrapper
  sendNotificationToUser(bid.scrapperId.toString(), {
    title: 'Bid Accepted! 🎉',
    body: `Congratulations! Your bid on "${request.title}" has been accepted.`,
    data: {
      requestId: request._id.toString(),
      type: 'bid_accepted'
    }
  });

  // Notify other scrappers that their bid was not selected
  try {
    const otherBids = await Bid.find({ requestId: request._id, _id: { $ne: bid._id } });
    const otherScrapperIds = otherBids.map(b => b.scrapperId.toString());
    if (otherScrapperIds.length > 0) {
      const { sendNotificationToMultipleUsers } = await import('../utils/pushNotificationHelper.js');
      sendNotificationToMultipleUsers(otherScrapperIds, {
        title: 'Bid Not Selected 📍',
        body: `The deal for "${request.title}" has been closed with another scrapper.`,
        data: { requestId: request._id.toString(), type: 'bid_rejected' }
      });
    }
  } catch (err) {
    logger.error('Error notifying rejected bidders:', err);
  }

  sendSuccess(res, 'Deal closed successfully. Contact details are now visible.', request);
});

/**
 * @desc    Get marketplace requests for current user (customer)
 * @route   GET /api/v1/marketplace/my-requests
 * @access  User
 */
export const getMyMarketplaceRequests = asyncHandler(async (req, res) => {
  const requests = await MarketplaceRequest.find({ userId: req.user.id })
    .sort({ createdAt: -1 });
  
  // For each request, find if there are any bids
  const requestsWithBids = await Promise.all(requests.map(async (request) => {
    const bids = await Bid.find({ requestId: request._id })
      .populate('scrapperId', 'name phone profilePic');
    
    return {
      ...request.toObject(),
      bids
    };
  }));

  sendSuccess(res, 'My marketplace requests fetched successfully', requestsWithBids);
});

/**
 * @desc    Report a marketplace request
 * @route   POST /api/v1/marketplace/requests/:id/report
 * @access  Scrapper
 */
export const reportMarketplaceRequest = asyncHandler(async (req, res) => {
  const request = await MarketplaceRequest.findById(req.params.id);
  
  if (!request) return sendError(res, 'Request not found', 404);
  
  // Check if already reported by this scrapper
  const alreadyReported = request.reports.some(
    r => r.scrapperId.toString() === req.user.id.toString()
  );

  if (alreadyReported) {
    return sendError(res, 'You have already reported this request', 400);
  }

  request.reports.push({
    scrapperId: req.user.id,
    reason: req.body.reason || 'Spam'
  });

  await request.save();

  sendSuccess(res, 'Request reported successfully');
});

/**
 * @desc    Delete marketplace request
 * @route   DELETE /api/v1/marketplace/requests/:id
 * @access  Admin
 */
export const deleteMarketplaceRequest = asyncHandler(async (req, res) => {
  const request = await MarketplaceRequest.findById(req.params.id);

  if (!request) {
    return sendError(res, 'Request not found', 404);
  }

  // Delete all bids associated with this request
  await Bid.deleteMany({ requestId: req.params.id });
  
  await request.deleteOne();

  sendSuccess(res, 'Marketplace request and associated bids deleted successfully');
});
