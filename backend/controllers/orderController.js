import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import Payment from '../models/Payment.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import { notifyUser } from '../services/socketService.js';
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
export const createOrder = asyncHandler(async (req, res) => {
  const {
    scrapItems,
    pickupAddress,
    preferredTime,
    pickupSlot,
    images,
    notes,
    orderType, // New field
    serviceDetails, // New field
    serviceFee // New field
  } = req.body;
  const userId = req.user.id;

  // New Wallet Check for Cleaning Service
  if (orderType === 'cleaning_service') {
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if user has minimum balance (₹100)
    if (!user.wallet || user.wallet.balance < 100) {
      return sendError(res, 'Insufficient wallet balance. Minimum ₹100 required to book a cleaning service. Please recharge your wallet.', 403);
    }
  }

  // Calculate totals
  let totalWeight = 0;
  let totalAmount = 0;

  if (orderType === 'cleaning_service') {
    // For service, amount is fixed fee
    totalAmount = serviceFee || 0;
    // totalWeight stays 0
  } else {
    // Default scrap logic
    if (scrapItems && Array.isArray(scrapItems)) {
      scrapItems.forEach(item => {
        totalWeight += item.weight || 0;
        totalAmount += item.total || 0;
      });
    }
  }

  const orderPayload = {
    user: userId,
    scrapItems: scrapItems || [],
    totalWeight,
    totalAmount,
    pickupAddress,
    preferredTime,
    pickupSlot,
    images: images || [],
    notes: notes || '',
    assignmentStatus: 'unassigned',
    status: ORDER_STATUS.PENDING
  };

  // Add new fields if present
  if (orderType) orderPayload.orderType = orderType;
  if (serviceDetails) orderPayload.serviceDetails = serviceDetails;
  if (serviceFee) orderPayload.serviceFee = serviceFee;

  const order = await Order.create(orderPayload);

  // Populate user details
  await order.populate('user', 'name phone email');

  logger.info(`Order created: ${order._id} by user: ${userId} (Type: ${order.orderType || 'scrap'})`);

  // --- NOTIFY ONLINE SCRAPPERS ---
  try {
    // 1. Find Scrappers who are Online, Active, and Verified
    const onlineScrappers = await Scrapper.find({
      isOnline: true,
      status: 'active',
      'kyc.status': 'verified'
    }).select('_id fcmTokens fcmTokenMobile');

    if (onlineScrappers.length > 0) {
      const notificationPayload = {
        title: 'New Order Request 🔔',
        body: 'A new pickup request is available near you!',
        data: {
          orderId: order._id.toString(),
          type: 'new_order'
        }
      };

      // Loop through scrappers to send notifications
      // We use Promise.allSettled to ensure one failure doesn't stop others
      await Promise.allSettled(onlineScrappers.map(async (scrapper) => {
        // A. Send Socket Event
        notifyUser(scrapper._id.toString(), 'new_order_request', {
          orderId: order._id,
          pickupAddress: order.pickupAddress,
          orderType: order.orderType || 'scrap_pickup',
          totalAmount: order.totalAmount,
          message: 'New pickup request available!'
        });

        // B. Send Push Notification
        // We reuse the helper which handles fetching tokens again, 
        // passing the ID is enough as the helper fetches the user/scrapper model.
        // Optimization: The helper fetches the model again. 
        // Since we already found them, we could optimize, but using the helper 
        // ensures consistency with how tokens are handled (web vs mobile).
        await sendNotificationToUser(scrapper._id.toString(), notificationPayload, 'scrapper');
      }));

      logger.info(`Notified ${onlineScrappers.length} online scrappers for Order ${order._id}`);
    } else {
      logger.info(`No online scrappers found for Order ${order._id}`);
    }
  } catch (notifyError) {
    logger.error('Error notifying scrappers:', notifyError);
    // Do not fail the request if notification fails
  }

  sendSuccess(res, 'Order created successfully', { order }, 201);
});

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private (User)
export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .populate('scrapper', 'name phone email vehicleInfo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  sendSuccess(res, 'Orders retrieved successfully', {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get available orders for scrappers
// @route   GET /api/orders/available
// @access  Private (Scrapper)
export const getAvailableOrders = asyncHandler(async (req, res) => {
  // Get orders that are:
  // 1. Unassigned
  // 2. Status is pending
  // 3. Not already assigned to this scrapper
  // 4. Matches scrapper's service types
  const scrapperId = req.user.id;

  // Fetch scrapper profile to check services
  const scrapper = await Scrapper.findById(scrapperId);
  if (!scrapper) {
    return sendError(res, 'Scrapper profile not found', 404);
  }

  const services = scrapper.services || ['scrap_pickup']; // Default to scrap only if not set

  // Build query
  const query = {
    status: ORDER_STATUS.PENDING,
    assignmentStatus: 'unassigned',
    scrapper: { $ne: scrapperId }
  };

  // Service filtering logic
  const allowedOrderTypes = [];

  if (services.includes('scrap_pickup')) {
    // Regular scrap orders usually don't have orderType or is 'scrap_pickup' or 'scrap'
    allowedOrderTypes.push(null, undefined, 'scrap_pickup', 'scrap', 'scrap_sell');
  }

  if (services.includes('home_cleaning')) {
    allowedOrderTypes.push('cleaning_service');
  }

  // Apply filter
  query.orderType = { $in: allowedOrderTypes };

  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .sort({ createdAt: -1 })
    .limit(20);

  sendSuccess(res, 'Available orders retrieved successfully', { orders });
});

// @desc    Get scrapper's assigned orders
// @route   GET /api/orders/my-assigned
// @access  Private (Scrapper)
export const getMyAssignedOrders = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const { status } = req.query;

  const query = { scrapper: scrapperId };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'name phone email')
    .populate('scrapper', 'name phone')
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Assigned orders retrieved successfully', { orders });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const scrapperId = req.user.scrapperId || req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(id)
    .populate('user', 'name phone email')
    .populate('scrapper', 'name phone liveLocation');

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Check access: User can only see their orders, Scrapper can see assigned orders
  if (userRole === 'user' && order.user._id.toString() !== userId) {
    return sendError(res, 'Not authorized to access this order', 403);
  }

  if (userRole === 'scrapper' && order.scrapper && order.scrapper._id.toString() !== scrapperId) {
    return sendError(res, 'Not authorized to access this order', 403);
  }

  sendSuccess(res, 'Order retrieved successfully', { order });
});

// @desc    Accept order (Scrapper)
// @route   POST /api/orders/:id/accept
// @access  Private (Scrapper)
export const acceptOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scrapperId = req.user.scrapperId || req.user.id;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Idempotency check: If already accepted by THIS scrapper, return success
  if (order.status === ORDER_STATUS.CONFIRMED && order.scrapper && order.scrapper.toString() === scrapperId) {
    logger.info(`[AcceptOrder] Order ${id} already accepted by this scrapper. Returning success.`);
    return sendSuccess(res, 'Order already accepted', { order });
  }

  // Check if order is available
  if (order.status !== ORDER_STATUS.PENDING) {
    logger.warn(`[AcceptOrder] Failed: Order ${id} status is ${order.status}, expected ${ORDER_STATUS.PENDING}`);
    return sendError(res, `Order is not available for acceptance (Status: ${order.status})`, 400);
  }

  if (order.assignmentStatus === 'accepted' || (order.scrapper && order.scrapper.toString() !== scrapperId)) {
    logger.warn(`[AcceptOrder] Failed: Order ${id} already accepted/assigned. Status: ${order.assignmentStatus}, Scrapper: ${order.scrapper}`);
    return sendError(res, 'Order is already accepted by another scrapper', 400);
  }

  // Check Scrapper Wallet Balance
  const scrapper = await Scrapper.findById(scrapperId);
  if (!scrapper) {
    return sendError(res, 'Scrapper profile not found', 404);
  }

  // Minimum balance check (₹100)
  if (scrapper.wallet.balance < 100) {
    return sendError(res, 'Insufficient wallet balance. You need minimum ₹100 to accept orders. Please recharge your wallet.', 403);
  }

  // Assign scrapper to order
  order.scrapper = scrapperId;
  order.assignmentStatus = 'accepted';
  order.status = ORDER_STATUS.CONFIRMED;
  order.assignedAt = new Date();
  order.acceptedAt = new Date();

  // Add to assignment history
  order.assignmentHistory.push({
    scrapper: scrapperId,
    assignedAt: new Date(),
    status: 'accepted'
  });

  await order.save();

  await order.populate('user', 'name phone');
  await order.populate('scrapper', 'name phone');

  logger.info(`Order ${id} accepted by scrapper ${scrapperId}`);

  sendSuccess(res, 'Order accepted successfully', { order });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Authorization checks
  if (userRole === 'user' && order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to update this order', 403);
  }

  if (userRole === 'scrapper' && order.scrapper && order.scrapper.toString() !== userId) {
    return sendError(res, 'Not authorized to update this order', 403);
  }

  // Validate status transition
  const validStatuses = Object.values(ORDER_STATUS);
  if (!validStatuses.includes(status)) {
    return sendError(res, 'Invalid order status', 400);
  }

  // Update status
  order.status = status;

  // Update paymentStatus if provided (e.g. for cash payments)
  const { paymentStatus } = req.body;
  if (paymentStatus) {
    const validPaymentStatuses = Object.values(PAYMENT_STATUS);
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return sendError(res, 'Invalid payment status', 400);
    }
    order.paymentStatus = paymentStatus;
  }

  // Update totalAmount if provided (e.g. final negotiated price)
  const { totalAmount } = req.body;
  if (totalAmount !== undefined && totalAmount !== null) {
    order.totalAmount = Number(totalAmount);
  }

  // Set completion date if completed
  if (status === ORDER_STATUS.COMPLETED) {
    order.completedDate = new Date();

    // ---------------------------------------------------------
    // WALLET & COMMISSION LOGIC
    // ---------------------------------------------------------

    // Case A: Cleaning Service (User pays Scrapper)
    // Commission: User pays 1% platform fee
    if (order.orderType === 'cleaning_service') {
      const user = await User.findById(order.user);
      if (user) {
        // Calculate 1% Commission
        const commissionAmount = Math.max(1, Math.round(order.totalAmount * 0.01));
        const balanceBefore = user.wallet.balance;

        // Deduct Commission from User Wallet
        user.wallet.balance -= commissionAmount;
        await user.save();

        const balanceAfter = user.wallet.balance;

        // Log the commission transaction
        await WalletTransaction.create({
          trxId: `TRX-COMM-${Date.now()}-${order._id.toString().slice(-4)}`,
          user: user._id,
          userType: 'User',
          amount: commissionAmount,
          type: 'DEBIT',
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          category: 'COMMISSION',
          status: 'SUCCESS',
          description: `Platform Fee (1%) for Cleaning Request #${order._id}`,
          orderId: order._id,
          gateway: { provider: 'SYSTEM' }
        });

        logger.info(`[Commission] Deducted ₹${commissionAmount} from User ${user._id} for Cleaning Order ${order._id}`);
      }
    }
    // Case B: Scrap Sell (Scrapper pays User)
    // Action 1: Deduct Order Amount from Scrapper Wallet (Payment to User)
    // Action 2: Deduct 1% Commission from Scrapper Wallet (Platform Fee)
    else if (order.scrapper) {
      const scrapper = await Scrapper.findById(order.scrapper);
      if (scrapper) {
        // 1. Deduct Order Amount (Payment to User)
        const orderAmount = order.totalAmount || 0;

        // FIX: Only deduct if payment has NOT been completed yet
        // If paid via wallet/online, paymentStatus is already 'completed', so we skip this
        if (orderAmount > 0 && order.paymentStatus !== 'completed') {
          const balanceBeforePay = scrapper.wallet.balance;
          scrapper.wallet.balance -= orderAmount;
          await scrapper.save();

          await WalletTransaction.create({
            trxId: `TRX-PAY-${Date.now()}-${order._id.toString().slice(-4)}`,
            user: scrapper._id,
            userType: 'Scrapper',
            amount: orderAmount,
            type: 'DEBIT',
            balanceBefore: balanceBeforePay,
            balanceAfter: scrapper.wallet.balance, // Updated balance
            category: 'PAYMENT_SENT', // Indicates money went OUT to User
            status: 'SUCCESS',
            description: `Payment to User for Order #${order._id}`,
            orderId: order._id,
            gateway: { provider: 'WALLET' }
          });
          logger.info(`[Wallet] Deducted ₹${orderAmount} from Scrapper ${scrapper._id} for Order Payment`);
        }

        // 2. Deduct 1% Commission
        // Reload scrapper to be safe or use current object? Using object is fine as we awaited save
        const commissionAmount = Math.max(1, Math.round(orderAmount * 0.01));
        const balanceBeforeComm = scrapper.wallet.balance;

        scrapper.wallet.balance -= commissionAmount;
        await scrapper.save();

        await WalletTransaction.create({
          trxId: `TRX-COMM-${Date.now()}-${order._id.toString().slice(-4)}`,
          user: scrapper._id,
          userType: 'Scrapper',
          amount: commissionAmount,
          type: 'DEBIT',
          balanceBefore: balanceBeforeComm,
          balanceAfter: scrapper.wallet.balance,
          category: 'COMMISSION',
          status: 'SUCCESS',
          description: `Platform Fee (1%) for Order #${order._id}`,
          orderId: order._id,
          gateway: { provider: 'SYSTEM' }
        });

        logger.info(`[Commission] Deducted ₹${commissionAmount} from Scrapper ${scrapper._id} for Order #${order._id}`);
      }
    }
  }

  await order.save();

  await order.populate('user', 'name phone');
  await order.populate('scrapper', 'name phone');

  logger.info(`Order ${id} status updated to ${status} (Payment: ${order.paymentStatus}) by ${userRole} ${userId}`);

  sendSuccess(res, 'Order status updated successfully', { order });
});

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Authorization: User can cancel their orders, Scrapper can cancel assigned orders
  if (userRole === 'user' && order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to cancel this order', 403);
  }

  if (userRole === 'scrapper' && order.scrapper && order.scrapper.toString() !== userId) {
    return sendError(res, 'Not authorized to cancel this order', 403);
  }

  // Check if order can be cancelled
  if (order.status === ORDER_STATUS.COMPLETED) {
    return sendError(res, 'Cannot cancel completed order', 400);
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    return sendError(res, 'Order is already cancelled', 400);
  }

  // Cancel order
  order.status = ORDER_STATUS.CANCELLED;
  order.assignmentStatus = 'unassigned';
  order.scrapper = null;
  if (reason) {
    order.notes = `${order.notes}\nCancellation reason: ${reason}`.trim();
  }

  await order.save();

  logger.info(`Order ${id} cancelled by ${userRole} ${userId}`);

  sendSuccess(res, 'Order cancelled successfully', { order });
});

// @desc    Update order (User can update pending orders)
// @route   PUT /api/orders/:id
// @access  Private (User)
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { scrapItems, pickupAddress, preferredTime, pickupSlot, images, notes } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Only user can update their own orders
  if (order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to update this order', 403);
  }

  // Can only update pending orders
  if (order.status !== ORDER_STATUS.PENDING) {
    return sendError(res, 'Can only update pending orders', 400);
  }

  // Update fields
  if (scrapItems) {
    order.scrapItems = scrapItems;
    // Recalculate totals
    let totalWeight = 0;
    let totalAmount = 0;
    scrapItems.forEach(item => {
      totalWeight += item.weight || 0;
      totalAmount += item.total || 0;
    });
    order.totalWeight = totalWeight;
    order.totalAmount = totalAmount;
  }

  if (pickupAddress) order.pickupAddress = pickupAddress;
  if (preferredTime) order.preferredTime = preferredTime;
  if (pickupSlot) order.pickupSlot = pickupSlot;
  if (images) order.images = images;
  if (notes !== undefined) order.notes = notes;

  await order.save();

  await order.populate('user', 'name phone');
  await order.populate('scrapper', 'name phone');

  logger.info(`Order ${id} updated by user ${userId}`);

  sendSuccess(res, 'Order updated successfully', { order });
});

