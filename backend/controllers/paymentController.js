import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { 
  getRazorpayClient, 
  createOrder, 
  verifyPayment as verifyPaymentAPI, 
  verifyPaymentSignature,
  refundPayment 
} from '../services/paymentService.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import Scrapper from '../models/Scrapper.js';

// @desc    Create Razorpay order for payment
// @route   POST /api/payments/create-order
// @access  Private
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  // Find the order
  const order = await Order.findById(orderId).populate('user', 'name email phone');

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Check if order belongs to user
  if (order.user._id.toString() !== userId) {
    return sendError(res, 'Not authorized to pay for this order', 403);
  }

  // Check if order is ready for payment
  if (order.status !== ORDER_STATUS.CONFIRMED && order.status !== ORDER_STATUS.IN_PROGRESS) {
    return sendError(res, 'Order is not ready for payment', 400);
  }

  // Check if payment already exists and is completed
  const existingPayment = await Payment.findOne({ order: orderId, user: userId });
  if (existingPayment && existingPayment.status === PAYMENT_STATUS.COMPLETED) {
    return sendError(res, 'Payment already completed for this order', 400);
  }

  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.error('[Payment] Razorpay keys not configured');
    return sendError(res, 'Payment gateway not configured. Please contact support.', 500);
  }

  let razorpay;
  try {
    razorpay = getRazorpayClient();
  } catch (razorpayError) {
    logger.error('[Payment] Razorpay client initialization error:', razorpayError);
    return sendError(res, 'Payment gateway initialization failed. Please contact support.', 500);
  }

  // Generate receipt ID (max 40 characters for Razorpay)
  const receiptId = `scrapto_${orderId.toString().slice(-20)}_${Date.now()}`.slice(0, 40);

  // Create Razorpay order
  let razorpayOrder;
  try {
    const options = {
      amount: Math.round(order.totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
      notes: {
        orderId: order._id.toString(),
        userId: userId.toString(),
        orderType: 'scrap_pickup'
      }
    };

    logger.info('[Payment] Creating Razorpay order:', {
      orderId: order._id,
      amount: options.amount,
      receipt: receiptId
    });

    razorpayOrder = await razorpay.orders.create(options);

    logger.info('[Payment] Razorpay order created:', razorpayOrder.id);
  } catch (razorpayError) {
    logger.error('[Payment] Razorpay order creation error:', razorpayError);
    
    let errorMessage = 'Failed to create payment order. Please try again later.';
    if (razorpayError.error?.description) {
      errorMessage = razorpayError.error.description;
    } else if (razorpayError.message) {
      errorMessage = razorpayError.message;
    }

    return sendError(res, errorMessage, 500);
  }

  // Create or update payment record
  const paymentData = {
    order: orderId,
    user: userId,
    amount: order.totalAmount,
    currency: 'INR',
    razorpayOrderId: razorpayOrder.id,
    receipt: receiptId,
    status: PAYMENT_STATUS.PENDING
  };

  let payment;
  if (existingPayment) {
    // Update existing payment
    Object.assign(existingPayment, paymentData);
    payment = await existingPayment.save();
  } else {
    // Create new payment
    payment = await Payment.create(paymentData);
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    logger.error('[Payment] RAZORPAY_KEY_ID not set');
    return sendError(res, 'Payment gateway key not configured', 500);
  }

  logger.info('[Payment] Payment order created:', {
    paymentId: payment._id,
    razorpayOrderId: razorpayOrder.id
  });

  sendSuccess(res, 'Payment order created successfully', {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency || 'INR',
    keyId: keyId,
    paymentId: payment._id
  });
});

// @desc    Verify payment and update status
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  // Find the order
  const order = await Order.findById(orderId);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Check if order belongs to user
  if (order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to verify payment for this order', 403);
  }

  // Find payment record
  const payment = await Payment.findOne({ 
    order: orderId, 
    user: userId,
    razorpayOrderId: razorpay_order_id 
  });

  if (!payment) {
    return sendError(res, 'Payment record not found', 404);
  }

  if (payment.status === PAYMENT_STATUS.COMPLETED) {
    return sendSuccess(res, 'Payment already verified', { payment, order });
  }

  // Verify payment signature
  if (razorpay_signature) {
    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      logger.warn('[Payment] Signature verification failed, trying API verification');
      // Continue with API verification even if signature fails
    }
  }

  // Verify payment via Razorpay API
  try {
    const verificationResult = await verifyPaymentAPI(razorpay_order_id);

    if (verificationResult.success && verificationResult.payment) {
      // Payment is successful
      payment.status = PAYMENT_STATUS.COMPLETED;
      payment.razorpayPaymentId = verificationResult.paymentId;
      payment.transactionId = verificationResult.paymentId;
      payment.paidAt = new Date();
      payment.razorpaySignature = razorpay_signature || null;
      await payment.save();

      // Update order payment status
      order.paymentStatus = PAYMENT_STATUS.COMPLETED;
      await order.save();

      logger.info('[Payment] Payment verified successfully:', {
        paymentId: payment._id,
        razorpayPaymentId: verificationResult.paymentId
      });

      await payment.populate('order', 'status paymentStatus totalAmount');
      await payment.populate('user', 'name email');

      return sendSuccess(res, 'Payment verified successfully', { payment, order });
    } else {
      // Payment not completed
      return sendError(res, 'Payment not completed. Please complete the payment.', 400);
    }
  } catch (error) {
    logger.error('[Payment] Payment verification error:', error);
    return sendError(res, 'Failed to verify payment. Please try again.', 500);
  }
});

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
export const getPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  const payment = await Payment.findById(paymentId)
    .populate('order')
    .populate('user', 'name email phone');

  if (!payment) {
    return sendError(res, 'Payment not found', 404);
  }

  // Check authorization
  if (payment.user._id.toString() !== userId) {
    return sendError(res, 'Not authorized to access this payment', 403);
  }

  sendSuccess(res, 'Payment retrieved successfully', { payment });
});

// @desc    Get user's payment history
// @route   GET /api/payments/my-payments
// @access  Private
export const getMyPayments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const payments = await Payment.find(query)
    .populate('order', 'status totalAmount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  sendSuccess(res, 'Payments retrieved successfully', {
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Refund payment
// @route   POST /api/payments/:paymentId/refund
// @access  Private (Admin or User for their own payments)
export const refundPaymentAmount = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const payment = await Payment.findById(paymentId)
    .populate('order')
    .populate('user');

  if (!payment) {
    return sendError(res, 'Payment not found', 404);
  }

  // Authorization: User can refund their own payments, Admin can refund any
  if (userRole !== 'admin' && payment.user._id.toString() !== userId) {
    return sendError(res, 'Not authorized to refund this payment', 403);
  }

  // Check if payment is completed
  if (payment.status !== PAYMENT_STATUS.COMPLETED) {
    return sendError(res, 'Only completed payments can be refunded', 400);
  }

  // Check if already refunded
  if (payment.refundId) {
    return sendError(res, 'Payment already refunded', 400);
  }

  // Check if payment has razorpay payment ID
  if (!payment.razorpayPaymentId) {
    return sendError(res, 'Payment ID not found. Cannot process refund.', 400);
  }

  // Validate refund amount
  const refundAmount = amount ? parseFloat(amount) : payment.amount;
  if (refundAmount <= 0 || refundAmount > payment.amount) {
    return sendError(res, 'Invalid refund amount', 400);
  }

  try {
    // Process refund via Razorpay
    const refund = await refundPayment(
      payment.razorpayPaymentId,
      refundAmount < payment.amount ? refundAmount : null // null = full refund
    );

    // Update payment record
    payment.refundId = refund.id;
    payment.refundAmount = refundAmount;
    payment.refundedAt = new Date();
    payment.status = PAYMENT_STATUS.REFUNDED;
    if (reason) {
      payment.notes = `${payment.notes}\nRefund reason: ${reason}`.trim();
    }
    await payment.save();

    // Update order payment status
    if (payment.order) {
      payment.order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      await payment.order.save();
    }

    logger.info('[Payment] Refund processed:', {
      paymentId: payment._id,
      refundId: refund.id,
      amount: refundAmount
    });

    sendSuccess(res, 'Refund processed successfully', { payment, refund });
  } catch (error) {
    logger.error('[Payment] Refund error:', error);
    return sendError(res, 'Failed to process refund. Please try again.', 500);
  }
});

// @desc    Get payment status (for polling)
// @route   GET /api/payments/order/:orderId/status
// @access  Private
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  if (order.user.toString() !== userId) {
    return sendError(res, 'Not authorized', 403);
  }

  const payment = await Payment.findOne({ order: orderId, user: userId });

  if (!payment) {
    return sendSuccess(res, 'Payment not initiated', { 
      status: PAYMENT_STATUS.PENDING,
      payment: null 
    });
  }

  // If payment is pending and has razorpay order ID, check status
  if (payment.status === PAYMENT_STATUS.PENDING && payment.razorpayOrderId) {
    try {
      const verificationResult = await verifyPaymentAPI(payment.razorpayOrderId);
      
      if (verificationResult.success && verificationResult.payment) {
        // Payment completed, update status
        payment.status = PAYMENT_STATUS.COMPLETED;
        payment.razorpayPaymentId = verificationResult.paymentId;
        payment.transactionId = verificationResult.paymentId;
        payment.paidAt = new Date();
        await payment.save();

        order.paymentStatus = PAYMENT_STATUS.COMPLETED;
        await order.save();
      }
    } catch (error) {
      logger.error('[Payment] Status check error:', error);
      // Continue with current status
    }
  }

  sendSuccess(res, 'Payment status retrieved', { 
    status: payment.status,
    payment 
  });
});

// @desc    Create subscription payment order (scrapper)
// @route   POST /api/payments/subscription/create
// @access  Private (Scrapper)
export const createSubscriptionPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, planName, durationDays } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return sendError(res, 'Valid amount is required', 400);
  }

  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.error('[Payment] Razorpay keys not configured');
    return sendError(res, 'Payment gateway not configured. Please contact support.', 500);
  }

  const keyId = process.env.RAZORPAY_KEY_ID;

  let razorpay;
  try {
    razorpay = getRazorpayClient();
  } catch (razorpayError) {
    logger.error('[Payment] Razorpay client initialization error:', razorpayError);
    return sendError(res, 'Payment gateway initialization failed. Please contact support.', 500);
  }

  const receiptId = `subscription_${userId}_${Date.now()}`.slice(0, 40);

  let razorpayOrder;
  try {
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
      notes: {
        entityType: 'subscription',
        userId,
        planName: planName || 'subscription',
        durationDays: durationDays || 30
      }
    };
    razorpayOrder = await razorpay.orders.create(options);
  } catch (err) {
    logger.error('[Payment] Razorpay subscription order creation error:', err);
    let errorMessage = 'Failed to create payment order. Please try again later.';
    if (err.error?.description) {
      errorMessage = err.error.description;
    } else if (err.message) {
      errorMessage = err.message;
    }
    return sendError(res, errorMessage, 500);
  }

  const paymentData = {
    order: null,
    entityType: 'subscription',
    entityId: req.user.id,
    user: userId,
    amount: Number(amount),
    currency: 'INR',
    razorpayOrderId: razorpayOrder.id,
    receipt: receiptId,
    status: PAYMENT_STATUS.PENDING,
    planName: planName || 'Subscription',
    durationDays: durationDays || 30
  };

  const payment = await Payment.create(paymentData);

  sendSuccess(res, 'Subscription payment order created', {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency || 'INR',
    keyId,
    paymentId: payment._id
  });
});

// @desc    Verify subscription payment
// @route   POST /api/payments/subscription/verify
// @access  Private (Scrapper)
export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
    user: userId,
    entityType: 'subscription'
  });

  if (!payment) {
    return sendError(res, 'Subscription payment record not found', 404);
  }

  if (payment.status === PAYMENT_STATUS.COMPLETED) {
    return sendSuccess(res, 'Payment already verified', { payment });
  }

  if (razorpay_signature) {
    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      logger.warn('[Payment] Subscription signature verification failed, trying API verification');
    }
  }

  try {
    const verificationResult = await verifyPaymentAPI(razorpay_order_id);

    if (verificationResult.success && verificationResult.payment) {
      payment.status = PAYMENT_STATUS.COMPLETED;
      payment.razorpayPaymentId = verificationResult.paymentId;
      payment.transactionId = verificationResult.paymentId;
      payment.paidAt = new Date();
      payment.razorpaySignature = razorpay_signature || null;
      await payment.save();

      // Update scrapper subscription using subscription service
      // This is kept for backward compatibility, but new subscriptions should use subscriptionController
      if (payment.planId) {
        // Use subscription service if planId exists
        const { activateSubscription } = await import('../services/subscriptionService.js');
        try {
          await activateSubscription(userId, payment._id);
        } catch (subError) {
          logger.error('[Payment] Error activating subscription via service:', subError);
          // Fallback to old method
          const scrapper = await Scrapper.findOne({ _id: userId });
          if (scrapper) {
            const days = payment.durationDays || 30;
            const startDate = new Date();
            const expiryDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
            scrapper.subscription.status = 'active';
            scrapper.subscription.startDate = startDate;
            scrapper.subscription.expiryDate = expiryDate;
            scrapper.subscription.planId = payment.planId;
            scrapper.subscription.razorpaySubscriptionId = payment.razorpayOrderId;
            scrapper.subscription.razorpayPaymentId = payment.razorpayPaymentId;
            await scrapper.save();
          }
        }
      } else {
        // Old method for backward compatibility
        const scrapper = await Scrapper.findOne({ _id: userId });
        if (scrapper) {
          const days = payment.durationDays || 30;
          const startDate = new Date();
          const expiryDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
          scrapper.subscription.status = 'active';
          scrapper.subscription.startDate = startDate;
          scrapper.subscription.expiryDate = expiryDate;
          scrapper.subscription.planId = null;
          scrapper.subscription.razorpaySubscriptionId = payment.razorpayOrderId;
          await scrapper.save();
        }
      }

      return sendSuccess(res, 'Subscription payment verified successfully', { payment });
    } else {
      return sendError(res, 'Payment not completed. Please complete the payment.', 400);
    }
  } catch (error) {
    logger.error('[Payment] Subscription verification error:', error);
    return sendError(res, 'Failed to verify payment. Please try again.', 500);
  }
});

// @desc    Handle Razorpay webhooks
// @route   POST /api/v1/payments/webhook
// @access  Public (secured via signature)
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('[Payment] Webhook secret not configured');
    return res.status(500).json({ success: false, message: 'Webhook not configured' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!signature || expectedSignature !== signature) {
    logger.warn('[Payment] Invalid webhook signature');
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity || null;

  if (!paymentEntity) {
    logger.info(`[Payment] Webhook ${event} received with no payment entity, skipping`);
    return res.status(200).json({ success: true });
  }

  const orderIdFromNotes = paymentEntity.notes?.orderId || paymentEntity.notes?.order_id || paymentEntity.order_id;
  const userIdFromNotes = paymentEntity.notes?.userId || paymentEntity.notes?.user_id;
  const entityTypeFromNotes = paymentEntity.notes?.entityType || 'order';
  const planNameFromNotes = paymentEntity.notes?.planName || null;
  const durationDaysFromNotes = paymentEntity.notes?.durationDays || null;
  const paymentId = paymentEntity.id;
  const razorpayOrderId = paymentEntity.order_id;
  const amount = paymentEntity.amount ? paymentEntity.amount / 100 : null;

  let payment = await Payment.findOne({ razorpayPaymentId: paymentId }) 
    || await Payment.findOne({ razorpayOrderId: razorpayOrderId });

  let order = null;
  if (orderIdFromNotes) {
    order = await Order.findById(orderIdFromNotes);
  }

  // Create payment record if it doesn't exist and we have enough info
  if (!payment && order && userIdFromNotes) {
    try {
      payment = await Payment.create({
        order: order._id,
        user: userIdFromNotes,
        amount: amount || order.totalAmount,
        currency: paymentEntity.currency || 'INR',
        status: PAYMENT_STATUS.PENDING,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        paymentMethod: paymentEntity.method || 'razorpay',
        notes: paymentEntity.description || ''
      });
    } catch (createError) {
      logger.error('[Payment] Failed to create payment from webhook:', createError);
      return res.status(200).json({ success: true });
    }
  }

  if (!payment) {
    logger.warn('[Payment] Webhook received but payment record not found and cannot be created', {
      paymentId,
      razorpayOrderId,
      orderIdFromNotes,
      userIdFromNotes
    });
    return res.status(200).json({ success: true });
  }

  const resolvedOrder = order || await Order.findById(payment.order);

  // Map webhook event to internal status
  if (event === 'payment.captured' || event === 'order.paid') {
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.paidAt = new Date();
    payment.razorpayPaymentId = paymentId || payment.razorpayPaymentId;
    payment.razorpayOrderId = razorpayOrderId || payment.razorpayOrderId;
    payment.amount = amount || payment.amount;

    if (payment.entityType === 'order' && resolvedOrder) {
      resolvedOrder.paymentStatus = PAYMENT_STATUS.COMPLETED;
      await resolvedOrder.save();
    }
    if (payment.entityType === 'subscription') {
      const days = payment.durationDays || durationDaysFromNotes || 30;
      const startDate = new Date();
      const expiryDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      const scrapper = await Scrapper.findById(payment.user);
      if (scrapper) {
        scrapper.subscription.status = 'active';
        scrapper.subscription.startDate = startDate;
        scrapper.subscription.expiryDate = expiryDate;
        scrapper.subscription.planId = null;
        scrapper.subscription.razorpaySubscriptionId = payment.razorpayOrderId;
        await scrapper.save();
      }
    }
  } else if (event === 'payment.failed') {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.razorpayPaymentId = paymentId || payment.razorpayPaymentId;
    payment.razorpayOrderId = razorpayOrderId || payment.razorpayOrderId;
    payment.amount = amount || payment.amount;

    if (payment.entityType === 'order' && resolvedOrder) {
      resolvedOrder.paymentStatus = PAYMENT_STATUS.FAILED;
      await resolvedOrder.save();
    }
  } else {
    logger.info(`[Payment] Webhook event ${event} acknowledged without state change`);
  }

  await payment.save();

  logger.info('[Payment] Webhook processed', { event, paymentId, razorpayOrderId });
  return res.status(200).json({ success: true });
});

