import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { ORDER_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

// @desc    Get scrapper earnings summary
// @route   GET /api/scrapper/earnings/summary
// @access  Private (Scrapper)
export const getEarningsSummary = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all completed orders for this scrapper
  const completedOrders = await Order.find({
    scrapper: scrapperId,
    status: ORDER_STATUS.COMPLETED
  }).select('totalAmount completedDate createdAt');

  // Calculate earnings
  let todayEarnings = 0;
  let weekEarnings = 0;
  let monthEarnings = 0;
  let totalEarnings = 0;

  completedOrders.forEach((order) => {
    const orderDate = order.completedDate || order.createdAt;
    const amount = order.totalAmount || 0;

    totalEarnings += amount;

    if (orderDate >= todayStart) {
      todayEarnings += amount;
    }

    if (orderDate >= weekAgo) {
      weekEarnings += amount;
    }

    if (orderDate >= monthStart) {
      monthEarnings += amount;
    }
  });

  // Calculate Average Rating
  const reviews = await Review.find({ scrapper: scrapperId }).select('rating');
  let avgRating = 0;
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    avgRating = parseFloat((totalRating / reviews.length).toFixed(1));
  } else {
    avgRating = 5.0; // Default for new scrappers
  }

  const summary = {
    today: todayEarnings,
    week: weekEarnings,
    month: monthEarnings,
    total: totalEarnings,
    completedOrders: completedOrders.length,
    rating: avgRating
  };

  sendSuccess(res, 'Earnings summary retrieved successfully', { summary });
});

// @desc    Get scrapper earnings history
// @route   GET /api/scrapper/earnings/history
// @access  Private (Scrapper)
export const getEarningsHistory = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  const query = {
    scrapper: scrapperId,
    status: ORDER_STATUS.COMPLETED
  };

  // Add date filters if provided
  if (startDate || endDate) {
    query.completedDate = {};
    if (startDate) {
      query.completedDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.completedDate.$lte = new Date(endDate);
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .select('totalAmount completedDate createdAt scrapItems totalWeight pickupAddress')
    .sort({ completedDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  // Map orders to earnings history format
  const history = orders.map((order) => ({
    id: order._id,
    orderId: order._id,
    userName: order.user?.name || 'User',
    userPhone: order.user?.phone || '',
    scrapType: order.scrapItems?.map((item) => item.category).join(', ') || 'Scrap',
    weight: order.totalWeight,
    amount: order.totalAmount,
    location: order.pickupAddress
      ? `${order.pickupAddress.street || ''}, ${order.pickupAddress.city || ''}, ${order.pickupAddress.state || ''} ${order.pickupAddress.pincode || ''}`.trim()
      : 'Address not available',
    completedAt: order.completedDate || order.createdAt,
    createdAt: order.createdAt
  }));

  sendSuccess(res, 'Earnings history retrieved successfully', {
    history,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get admin view of scrapper earnings
// @route   GET /api/admin/scrappers/:scrapperId/earnings
// @access  Private (Admin)
export const getScrapperEarningsForAdmin = asyncHandler(async (req, res) => {
  const { scrapperId } = req.params;
  const { startDate, endDate } = req.query;

  const query = {
    scrapper: scrapperId,
    status: ORDER_STATUS.COMPLETED
  };

  if (startDate || endDate) {
    query.completedDate = {};
    if (startDate) {
      query.completedDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.completedDate.$lte = new Date(endDate);
    }
  }

  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .select('totalAmount completedDate createdAt scrapItems totalWeight pickupAddress')
    .sort({ completedDate: -1 });

  // Calculate earnings breakdown
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let todayEarnings = 0;
  let weekEarnings = 0;
  let monthEarnings = 0;
  let totalEarnings = 0;

  const formattedOrders = orders.map((order) => {
    const amount = order.totalAmount || 0;
    const orderDate = order.completedDate || order.createdAt;

    // Filter by date for stats (unless specific date range query is active, in which case we might just be showing filtered total, but for the profile view we generally want the standard breakdown)
    // If no specific date filter is applied, we calculate standard stats.
    if (!startDate && !endDate) {
      totalEarnings += amount;
      if (orderDate >= todayStart) todayEarnings += amount;
      if (orderDate >= weekAgo) weekEarnings += amount;
      if (orderDate >= monthStart) monthEarnings += amount;
    } else {
      // If date filtered, just sum total for that range
      totalEarnings += amount;
    }

    return {
      id: order._id,
      orderId: order._id,
      userName: order.user?.name || 'User',
      amount: order.totalAmount,
      completedAt: order.completedDate || order.createdAt,
      scrapType: order.scrapItems?.map((item) => item.category).join(', ') || 'Scrap',
      weight: order.totalWeight,
      location: order.pickupAddress
        ? `${order.pickupAddress.street || ''}, ${order.pickupAddress.city || ''}, ${order.pickupAddress.state || ''} ${order.pickupAddress.pincode || ''}`.trim()
        : 'Address not available',
    };
  });

  const summary = {
    scrapperId,
    today: todayEarnings,
    week: weekEarnings,
    month: monthEarnings,
    total: totalEarnings,
    totalOrders: orders.length,
    orders: formattedOrders
  };

  sendSuccess(res, 'Scrapper earnings retrieved successfully', { summary });
});

