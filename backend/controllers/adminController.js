import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Price from '../models/Price.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { USER_ROLES, ORDER_STATUS, PAYMENT_STATUS, PAGINATION } from '../config/constants.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { createContact, createFundAccount, initiatePayout } from '../services/payoutService.js';

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const [
      totalUsers,
      totalScrappers,
      totalOrders,
      totalPayments,
      activeSubscriptions,
      pendingKyc,
      todayOrders,
      todayRevenue,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.USER }),
      Scrapper.countDocuments(),
      Order.countDocuments(),
      Payment.countDocuments({ status: PAYMENT_STATUS.COMPLETED }),
      Scrapper.countDocuments({ 'subscription.status': 'active' }),
      Scrapper.countDocuments({ 'kyc.status': 'pending' }),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.COMPLETED,
            paidAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.COMPLETED,
            paidAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: await User.countDocuments({ role: USER_ROLES.USER, isActive: true })
      },
      scrappers: {
        total: totalScrappers,
        active: await Scrapper.countDocuments({ status: 'active' }),
        verified: await Scrapper.countDocuments({ 'kyc.status': 'verified' }),
        pendingKyc
      },
      orders: {
        total: totalOrders,
        pending: await Order.countDocuments({ status: ORDER_STATUS.PENDING }),
        inProgress: await Order.countDocuments({ status: ORDER_STATUS.IN_PROGRESS }),
        completed: await Order.countDocuments({ status: ORDER_STATUS.COMPLETED }),
        today: todayOrders
      },
      payments: {
        total: totalPayments,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      subscriptions: {
        active: activeSubscriptions
      }
    };

    sendSuccess(res, 'Dashboard statistics retrieved successfully', { stats });
  } catch (error) {
    logger.error('[Admin] Error fetching dashboard stats:', error);
    sendError(res, 'Failed to fetch dashboard statistics', 500);
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Admin)
// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { role: USER_ROLES.USER };
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await User.countDocuments(filter);

    // Aggregate users with dynamic data
    const users = await User.aggregate([
      { $match: filter },
      // Lookup orders to calculate stats
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'userOrders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$userOrders' },
          // Calculate total spent (walletBalance) from completed orders
          walletBalance: {
            $reduce: {
              input: {
                $filter: {
                  input: '$userOrders',
                  as: 'order',
                  cond: { $eq: ['$$order.status', 'completed'] }
                }
              },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.totalAmount', 0] }] }
            }
          }
        }
      },
      // Remove sensitive fields and heavy arrays
      {
        $project: {
          password: 0,
          phoneVerificationOTP: 0,
          resetPasswordToken: 0,
          verificationToken: 0,
          userOrders: 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching users:', error);
    sendError(res, 'Failed to fetch users', 500);
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -phoneVerificationOTP -resetPasswordToken -verificationToken');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get user's orders count
    const ordersCount = await Order.countDocuments({ user: user._id });

    sendSuccess(res, 'User retrieved successfully', {
      user: {
        ...user.toObject(),
        ordersCount
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching user:', error);
    sendError(res, 'Failed to fetch user', 500);
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, isActive, address } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    sendSuccess(res, 'User updated successfully', {
      user: user.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error updating user:', error);
    if (error.code === 11000) {
      return sendError(res, 'Email or phone already exists', 400);
    }
    sendError(res, 'Failed to update user', 500);
  }
});

// @desc    Block/Unblock user
// @route   PATCH /api/admin/users/:id/block
// @access  Private (Admin)
export const blockUser = asyncHandler(async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    await user.save();

    sendSuccess(res, `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`, {
      user: user.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error blocking user:', error);
    sendError(res, 'Failed to block/unblock user', 500);
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if user has orders
    const ordersCount = await Order.countDocuments({ user: userId });
    if (ordersCount > 0) {
      return sendError(res, 'Cannot delete user with existing orders', 400);
    }

    await User.findByIdAndDelete(userId);

    sendSuccess(res, 'User deleted successfully', {});
  } catch (error) {
    logger.error('[Admin] Error deleting user:', error);
    sendError(res, 'Failed to delete user', 500);
  }
});

// ============================================
// SCRAPPER MANAGEMENT
// ============================================

// @desc    Get all scrappers with pagination and filters
// @route   GET /api/admin/scrappers
// @access  Private (Admin)
// @desc    Get all scrappers with pagination and filters
// @route   GET /api/admin/scrappers
// @access  Private (Admin)
// @desc    Get all scrappers with pagination and filters
// @route   GET /api/admin/scrappers
// @access  Private (Admin)
// @desc    Get all scrappers with pagination and filters
// @route   GET /api/admin/scrappers
// @access  Private (Admin)
export const getAllScrappers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.kycStatus) {
      filter['kyc.status'] = req.query.kycStatus;
    }
    if (req.query.subscriptionStatus) {
      filter['subscription.status'] = req.query.subscriptionStatus;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await Scrapper.countDocuments(filter);

    // Aggregate data
    const scrappers = await Scrapper.aggregate([
      { $match: filter },
      // Lookup Orders
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'scrapper',
          as: 'scrapperOrders'
        }
      },
      // Lookup Reviews
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'scrapper',
          as: 'scrapperReviews'
        }
      },
      {
        $addFields: {
          // Filter completed orders
          completedOrders: {
            $filter: {
              input: '$scrapperOrders',
              as: 'order',
              cond: { $eq: ['$$order.status', 'completed'] }
            }
          },
          // Calculate Rating
          rating: {
            $ifNull: [{ $avg: '$scrapperReviews.rating' }, 0]
          }
        }
      },
      {
        $addFields: {
          totalPickups: { $size: '$completedOrders' },
          // Flatten earnings total
          'earnings.total': {
            $reduce: {
              input: '$completedOrders',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.totalAmount', 0] }] }
            }
          }
        }
      },
      // Clean up output
      {
        $project: {
          scrapperOrders: 0,
          scrapperReviews: 0,
          completedOrders: 0,
          'kyc.aadhaarNumber': 0,
          'kyc.licenseNumber': 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    sendSuccess(res, 'Scrappers retrieved successfully', {
      scrappers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching scrappers:', error);
    sendError(res, 'Failed to fetch scrappers', 500);
  }
});

// @desc    Get scrapper by ID
// @route   GET /api/admin/scrappers/:id
// @access  Private (Admin)
// @desc    Get scrapper by ID
// @route   GET /api/admin/scrappers/:id
// @access  Private (Admin)
export const getScrapperById = asyncHandler(async (req, res) => {
  try {
    // Admin needs to see full details including hidden fields like aadhaarNumber
    const scrapper = await Scrapper.findById(req.params.id)
      .select('+kyc.aadhaarNumber');

    if (!scrapper) {
      return sendError(res, 'Scrapper not found', 404);
    }

    // Get scrapper's orders count
    const ordersCount = await Order.countDocuments({ scrapper: scrapper._id });

    sendSuccess(res, 'Scrapper retrieved successfully', {
      scrapper: {
        ...scrapper.toObject(),
        ordersCount
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching scrapper:', error);
    sendError(res, 'Failed to fetch scrapper', 500);
  }
});

// @desc    Update scrapper
// @route   PUT /api/admin/scrappers/:id
// @access  Private (Admin)
export const updateScrapper = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, status, vehicleInfo, address } = req.body;
    const scrapperId = req.params.id;

    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
      return sendError(res, 'Scrapper not found', 404);
    }

    // Update fields
    if (name) scrapper.name = name;
    if (email) scrapper.email = email;
    if (phone) scrapper.phone = phone;
    if (status) scrapper.status = status;
    if (vehicleInfo) scrapper.vehicleInfo = { ...scrapper.vehicleInfo, ...vehicleInfo };
    if (address) scrapper.address = { ...scrapper.address, ...address };

    await scrapper.save();

    sendSuccess(res, 'Scrapper updated successfully', {
      scrapper: scrapper.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error updating scrapper:', error);
    if (error.code === 11000) {
      return sendError(res, 'Email or phone already exists', 400);
    }
    sendError(res, 'Failed to update scrapper', 500);
  }
});

// @desc    Block/Unblock/Suspend scrapper
// @route   PATCH /api/admin/scrappers/:id/status
// @access  Private (Admin)
// @desc    Block/Unblock/Suspend scrapper
// @route   PATCH /api/admin/scrappers/:id/status
// @access  Private (Admin)
// @desc    Block/Unblock/Suspend scrapper
// @route   PATCH /api/admin/scrappers/:id/status
// @access  Private (Admin)
export const updateScrapperStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const scrapperId = req.params.id;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    if (!['active', 'blocked', 'suspended'].includes(status)) {
      return sendError(res, 'Invalid status. Must be: active, blocked, or suspended', 400);
    }

    const scrapper = await Scrapper.findByIdAndUpdate(
      scrapperId,
      { status },
      { new: true, runValidators: true }
    );

    if (!scrapper) {
      return sendError(res, 'Scrapper not found', 404);
    }

    sendSuccess(res, `Scrapper status updated to ${status}`, {
      scrapper: scrapper.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error updating scrapper status:', error);
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid Scrapper ID', 400);
    }
    if (error.name === 'ValidationError') {
      return sendError(res, error.message, 400);
    }
    // Return actual error message for debugging
    sendError(res, `Failed to update scrapper status: ${error.message}`, 500);
  }
});

// @desc    Delete scrapper
// @route   DELETE /api/admin/scrappers/:id
// @access  Private (Admin)
export const deleteScrapper = asyncHandler(async (req, res) => {
  try {
    const scrapperId = req.params.id;

    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
      return sendError(res, 'Scrapper not found', 404);
    }

    // Check if scrapper has orders
    const ordersCount = await Order.countDocuments({ scrapper: scrapperId });
    if (ordersCount > 0) {
      return sendError(res, 'Cannot delete scrapper with existing orders', 400);
    }

    await Scrapper.findByIdAndDelete(scrapperId);

    sendSuccess(res, 'Scrapper deleted successfully', {});
  } catch (error) {
    logger.error('[Admin] Error deleting scrapper:', error);
    sendError(res, 'Failed to delete scrapper', 500);
  }
});

// ============================================
// ORDER MANAGEMENT
// ============================================

// @desc    Get all orders with pagination and filters
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    if (req.query.scrapperId) {
      filter.scrapper = req.query.scrapperId;
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filter.createdAt.$lte = new Date(req.query.dateTo);
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .populate('scrapper', 'name phone vehicleInfo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    sendSuccess(res, 'Orders retrieved successfully', {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching orders:', error);
    sendError(res, 'Failed to fetch orders', 500);
  }
});

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
export const getOrderById = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('scrapper', 'name phone email vehicleInfo address');

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Get payment details if exists
    const payment = await Payment.findOne({ order: order._id });

    sendSuccess(res, 'Order retrieved successfully', {
      order: {
        ...order.toObject(),
        payment
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching order:', error);
    sendError(res, 'Failed to fetch order', 500);
  }
});

// @desc    Update order
// @route   PUT /api/admin/orders/:id
// @access  Private (Admin)
export const updateOrder = asyncHandler(async (req, res) => {
  try {
    const { status, paymentStatus, scrapper, totalAmount, scrapItems } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Update fields
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (scrapper) order.scrapper = scrapper;
    if (totalAmount) order.totalAmount = totalAmount;
    if (scrapItems) {
      order.scrapItems = scrapItems;
      // Recalculate total weight
      order.totalWeight = scrapItems.reduce((sum, item) => sum + item.weight, 0);
    }

    await order.save();

    sendSuccess(res, 'Order updated successfully', {
      order: order.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error updating order:', error);
    sendError(res, 'Failed to update order', 500);
  }
});

// @desc    Manually assign order to scrapper
// @route   POST /api/admin/orders/:id/assign
// @access  Private (Admin)
export const assignOrder = asyncHandler(async (req, res) => {
  try {
    const { scrapperId } = req.body;
    const orderId = req.params.id;

    if (!scrapperId) {
      return sendError(res, 'Scrapper ID is required', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
      return sendError(res, 'Scrapper not found', 404);
    }

    // Check if scrapper is active and has verified KYC
    if (scrapper.status !== 'active') {
      return sendError(res, 'Scrapper is not active', 400);
    }

    if (scrapper.kyc.status !== 'verified') {
      return sendError(res, 'Scrapper KYC is not verified', 400);
    }

    // Check if scrapper has active subscription
    if (scrapper.subscription.status !== 'active') {
      return sendError(res, 'Scrapper does not have active subscription', 400);
    }

    // Assign order
    order.scrapper = scrapperId;
    order.status = ORDER_STATUS.CONFIRMED;
    order.assignedAt = new Date();

    // Add to assignment history
    order.assignmentHistory.push({
      scrapper: scrapperId,
      assignedAt: new Date(),
      status: 'assigned'
    });

    await order.save();

    sendSuccess(res, 'Order assigned successfully', {
      order: order.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error assigning order:', error);
    sendError(res, 'Failed to assign order', 500);
  }
});

// @desc    Cancel order
// @route   POST /api/admin/orders/:id/cancel
// @access  Private (Admin)
export const cancelOrder = asyncHandler(async (req, res) => {
  try {
    const { reason } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return sendError(res, 'Order is already cancelled', 400);
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      return sendError(res, 'Cannot cancel completed order', 400);
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by admin';

    await order.save();

    sendSuccess(res, 'Order cancelled successfully', {
      order: order.toObject()
    });
  } catch (error) {
    logger.error('[Admin] Error cancelling order:', error);
    sendError(res, 'Failed to cancel order', 500);
  }
});

// ============================================
// PRICE FEED MANAGEMENT
// ============================================

// @desc    Get all price entries
// @route   GET /api/admin/prices
// @access  Private (Admin)
export const getAllPrices = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.regionCode) {
      filter.regionCode = req.query.regionCode;
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const [prices, total] = await Promise.all([
      Price.find(filter)
        .populate('updatedBy', 'name email')
        .sort({ effectiveDate: -1, category: 1 })
        .skip(skip)
        .limit(limit),
      Price.countDocuments(filter)
    ]);

    sendSuccess(res, 'Prices retrieved successfully', {
      prices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching prices:', error);
    sendError(res, 'Failed to fetch prices', 500);
  }
});

// @desc    Create price entry
// @route   POST /api/admin/prices
// @access  Private (Admin)
export const createPrice = asyncHandler(async (req, res) => {
  try {
    const { category, pricePerKg, price: fixedPrice, regionCode, effectiveDate, isActive, image, type } = req.body;

    if (!category) {
      return sendError(res, 'Category is required', 400);
    }

    // Validate price based on type
    if (type === 'service' && fixedPrice === undefined) {
      // if service, we expect 'price' (fixedPrice here)
      // But if frontend sends 0, it's valid.
    }

    // Deactivate old prices for same category and region
    if (isActive !== false) {
      await Price.updateMany(
        { category, regionCode, isActive: true },
        { isActive: false }
      );
    }

    const newPriceEntry = await Price.create({
      category,
      pricePerKg: pricePerKg || 0,
      price: fixedPrice || 0,
      regionCode: regionCode || 'IN-DL',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      isActive: isActive !== undefined ? isActive : true,
      updatedBy: req.user.id,
      image,
      type: type || 'material'
    });

    sendSuccess(res, 'Price created successfully', { price: newPriceEntry });
  } catch (error) {
    logger.error('[Admin] Error creating price:', error);
    sendError(res, 'Failed to create price', 500);
  }
});

// @desc    Update price entry
// @route   PUT /api/admin/prices/:id
// @access  Private (Admin)
export const updatePrice = asyncHandler(async (req, res) => {
  try {
    const { pricePerKg, effectiveDate, isActive, image } = req.body;
    const priceId = req.params.id;

    const price = await Price.findById(priceId);
    if (!price) {
      return sendError(res, 'Price not found', 404);
    }

    if (pricePerKg) price.pricePerKg = pricePerKg;
    if (effectiveDate) price.effectiveDate = new Date(effectiveDate);
    if (isActive !== undefined) price.isActive = isActive;
    if (isActive !== undefined) price.isActive = isActive;
    if (image !== undefined) price.image = image;
    price.updatedBy = req.user.id;

    await price.save();

    sendSuccess(res, 'Price updated successfully', { price });
  } catch (error) {
    logger.error('[Admin] Error updating price:', error);
    sendError(res, 'Failed to update price', 500);
  }
});

// @desc    Delete price entry
// @route   DELETE /api/admin/prices/:id
// @access  Private (Admin)
export const deletePrice = asyncHandler(async (req, res) => {
  try {
    const price = await Price.findById(req.params.id);
    if (!price) {
      return sendError(res, 'Price not found', 404);
    }

    await Price.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'Price deleted successfully', {});
  } catch (error) {
    logger.error('[Admin] Error deleting price:', error);
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid Price ID', 400);
    }
    sendError(res, 'Failed to delete price', 500);
  }
});

// ============================================
// PAYMENT & REVENUE ANALYTICS
// ============================================

// @desc    Get payment analytics
// @route   GET /api/admin/analytics/payments
// @access  Private (Admin)
export const getPaymentAnalytics = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.paidAt = {};
      if (startDate) dateFilter.paidAt.$gte = new Date(startDate);
      if (endDate) dateFilter.paidAt.$lte = new Date(endDate);
    }

    const [
      totalRevenue,
      totalPayments,
      statusBreakdown,
      dailyRevenue,
      monthlyRevenue
    ] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.COMPLETED,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Payment.countDocuments({
        status: PAYMENT_STATUS.COMPLETED,
        ...dateFilter
      }),
      Payment.aggregate([
        {
          $match: dateFilter
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.COMPLETED,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$paidAt' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.COMPLETED,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$paidAt' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Fetch Admin Bank Details
    const adminUser = await User.findById(req.user.id).select('bankDetails');
    const bankDetails = adminUser?.bankDetails ? {
      accountNumber: adminUser.bankDetails.accountNumber ? `****${adminUser.bankDetails.accountNumber.slice(-4)}` : '',
      beneficiaryName: adminUser.bankDetails.beneficiaryName,
      bankName: adminUser.bankDetails.bankName,
      isConfigured: !!adminUser.bankDetails.fundAccountId
    } : null;

    // --- Added Commission Logic ---
    const walletDateFilter = {};
    if (startDate || endDate) {
      walletDateFilter.createdAt = {};
      if (startDate) walletDateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) walletDateFilter.createdAt.$lte = new Date(endDate);
    }

    // Fetch Commissions within date range
    const [statsCommissions] = await WalletTransaction.aggregate([
      { $match: { category: 'COMMISSION', type: 'DEBIT', ...walletDateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const commissionRevenue = statsCommissions?.total || 0;

    // Fetch Total Admin Balance (All Time)
    const [allTimeCommissions, allTimeWithdrawals] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { category: 'COMMISSION', type: 'DEBIT' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { category: 'WITHDRAWAL', context: 'system_payout' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    const adminBalance = (allTimeCommissions[0]?.total || 0) - (allTimeWithdrawals[0]?.total || 0);

    const paymentTotal = totalRevenue[0]?.total || 0;

    sendSuccess(res, 'Payment analytics retrieved successfully', {
      totalRevenue: paymentTotal + commissionRevenue,
      revenueBreakdown: {
        payments: paymentTotal,
        commissions: commissionRevenue
      },
      adminWalletBalance: adminBalance,
      totalPayments,
      statusBreakdown,
      dailyRevenue,
      monthlyRevenue,
      bankDetails
    });

  } catch (error) {
    logger.error('[Admin] Error fetching payment analytics:', error);
    sendError(res, 'Failed to fetch payment analytics', 500);
  }
});

// @desc    Get all subscription plans (Admin)
// @route   GET /api/admin/subscriptions/plans
// @access  Private (Admin)
export const getAllSubscriptionPlans = asyncHandler(async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ isActive: -1, sortOrder: 1, createdAt: -1 });
    sendSuccess(res, 'Subscription plans retrieved successfully', { plans });
  } catch (error) {
    logger.error('[Admin] Error fetching subscription plans:', error);
    sendError(res, 'Failed to fetch subscription plans', 500);
  }
});

// ============================================
// SUBSCRIPTION PLAN MANAGEMENT (Admin)
// ============================================

// @desc    Create subscription plan
// @route   POST /api/admin/subscriptions/plans
// @access  Private (Admin)
export const createPlan = asyncHandler(async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    sendSuccess(res, 'Subscription plan created successfully', { plan });
  } catch (error) {
    logger.error('[Admin] Error creating plan:', error);
    sendError(res, 'Failed to create subscription plan', 500);
  }
});

// @desc    Update subscription plan
// @route   PUT /api/admin/subscriptions/plans/:id
// @access  Private (Admin)
export const updatePlan = asyncHandler(async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return sendError(res, 'Plan not found', 404);
    }

    sendSuccess(res, 'Subscription plan updated successfully', { plan });
  } catch (error) {
    logger.error('[Admin] Error updating plan:', error);
    sendError(res, 'Failed to update subscription plan', 500);
  }
});

// @desc    Delete subscription plan
// @route   DELETE /api/admin/subscriptions/plans/:id
// @access  Private (Admin)
export const deletePlan = asyncHandler(async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return sendError(res, 'Plan not found', 404);
    }

    // Check if any active subscriptions use this plan
    const activeSubscriptions = await Scrapper.countDocuments({
      'subscription.planId': plan._id,
      'subscription.status': 'active'
    });

    if (activeSubscriptions > 0) {
      return sendError(res, 'Cannot delete plan with active subscriptions. Deactivate instead.', 400);
    }

    await SubscriptionPlan.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'Subscription plan deleted successfully', {});
  } catch (error) {
    logger.error('[Admin] Error deleting plan:', error);
    sendError(res, 'Failed to delete subscription plan', 500);
  }
});

// @desc    Get all subscriptions (admin)
// @route   GET /api/admin/subscriptions/all
// @access  Private (Admin)
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter['subscription.status'] = req.query.status;
    }

    const [scrappers, total] = await Promise.all([
      Scrapper.find(filter)
        .select('name phone email subscription')
        .populate('subscription.planId', 'name price duration durationType')
        .sort({ 'subscription.startDate': -1 })
        .skip(skip)
        .limit(limit),
      Scrapper.countDocuments(filter)
    ]);

    sendSuccess(res, 'Subscriptions retrieved successfully', {
      subscriptions: scrappers.map(s => ({
        scrapper: {
          id: s._id,
          name: s.name,
          phone: s.phone,
          email: s.email
        },
        subscription: s.subscription
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('[Admin] Error fetching subscriptions:', error);
    sendError(res, 'Failed to fetch subscriptions', 500);
  }
});

// @desc    Withdraw Admin Funds (System Payout)
// @route   POST /api/admin/finance/withdraw
// @access  Private (Admin)
// @desc    Update Admin Bank Details (For Payouts)
// @route   PUT /api/admin/finance/bank-details
// @access  Private (Admin)
export const updateAdminBankDetails = asyncHandler(async (req, res) => {
  const { accountNumber, ifsc, beneficiaryName, bankName } = req.body;
  const userId = req.user.id;

  if (!accountNumber || !ifsc || !beneficiaryName) {
    return sendError(res, 'Please provide Account Number, IFSC and Beneficiary Name', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // 1. Create/Get Contact on Razorpay X
  let contactId = user.bankDetails?.contactId;
  if (!contactId) {
    try {
      const contact = await createContact(user.name, user.email, user.phone);
      contactId = contact.id;
    } catch (err) {
      return sendError(res, 'Failed to register contact on Razorpay: ' + err.message, 500);
    }
  }

  // 2. Create Fund Account on Razorpay X
  let fundAccountId;
  try {
    const fundAccount = await createFundAccount(contactId, {
      accountNumber,
      ifsc,
      name: beneficiaryName
    });
    fundAccountId = fundAccount.id;
  } catch (err) {
    return sendError(res, 'Failed to verify bank account with Razorpay: ' + err.message, 500);
  }

  // 3. Save to DB
  user.bankDetails = {
    accountNumber: accountNumber.slice(-4), // Only store last 4 digits for display
    ifsc,
    beneficiaryName,
    bankName,
    contactId,
    fundAccountId
  };

  await user.save();

  sendSuccess(res, 'Bank details updated successfully', {
    bankDetails: user.bankDetails
  });
});

// @desc    Withdraw Admin Funds (System Payout)
// @route   POST /api/admin/finance/withdraw
// @access  Private (Admin)
export const withdrawFunds = asyncHandler(async (req, res) => {
  const { amount, notes } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return sendError(res, 'Invalid withdrawal amount', 400);
  }

  // 1. Check Bank Details
  const user = await User.findById(userId);
  if (!user.bankDetails?.fundAccountId) {
    return sendError(res, 'Bank details not found. Please configure withdrawal account first.', 400);
  }

  // Check Balance logic (Recalculating to be safe)
  const [allTimeCommissions, allTimeWithdrawals] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: { category: 'COMMISSION', type: 'DEBIT' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    WalletTransaction.aggregate([
      { $match: { category: 'WITHDRAWAL', context: 'system_payout' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const currentBalance = (allTimeCommissions[0]?.total || 0) - (allTimeWithdrawals[0]?.total || 0);

  if (currentBalance < amount) {
    return sendError(res, 'Insufficient funds in Admin Wallet', 400);
  }

  // 2. Initiate Real Payout via Razorpay
  let payoutResult;
  try {
    const referenceId = `wd_${Date.now()}`;
    payoutResult = await initiatePayout(
      user.bankDetails.fundAccountId,
      amount,
      'IMPS',
      'payout',
      referenceId
    );
  } catch (err) {
    return sendError(res, 'Withdrawal Failed at Gateway: ' + err.message, 500);
  }

  // 3. Record Withdrawal (Only if API succeeds)
  const transaction = await WalletTransaction.create({
    trxId: `TRX-ADM-WD-${Date.now()}`,
    user: req.user.id, // Logged in Admin ID
    userType: 'User', // Admin is a User
    amount: amount,
    type: 'DEBIT',
    balanceBefore: currentBalance,
    balanceAfter: currentBalance - amount,
    category: 'WITHDRAWAL',
    status: payoutResult.status === 'processed' ? 'SUCCESS' : 'PENDING', // Razorpay often returns 'processing'
    description: notes || 'Admin Payout Withdrawal',
    context: 'system_payout',
    gateway: {
      provider: 'RAZORPAY_X',
      paymentId: payoutResult.id, // Payout ID
      status: payoutResult.status
    }
  });

  sendSuccess(res, 'Withdrawal processed successfully', {
    amount,
    remainingBalance: currentBalance - amount,
    transactionId: transaction.trxId,
    payoutStatus: payoutResult.status
  });
});

