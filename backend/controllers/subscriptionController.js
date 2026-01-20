import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import {
  getActivePlans,
  getPlanById,
  getScrapperSubscription,
  cancelSubscription,
  renewSubscription,
  getSubscriptionHistory
} from '../services/subscriptionService.js';
import { createSubscription, activateSubscription } from '../services/subscriptionService.js';
import { createOrder } from '../services/paymentService.js';
import Payment from '../models/Payment.js';
import Scrapper from '../models/Scrapper.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import { PAYMENT_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

// @desc    Get all active subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public (or Private for scrappers)
export const getPlans = asyncHandler(async (req, res) => {
  const result = await getActivePlans();
  sendSuccess(res, 'Plans retrieved successfully', { plans: result.plans });
});

// @desc    Get plan by ID
// @route   GET /api/subscriptions/plans/:id
// @access  Public (or Private for scrappers)
export const getPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getPlanById(id);
  sendSuccess(res, 'Plan retrieved successfully', { plan: result.plan });
});

// @desc    Get scrapper's current subscription
// @route   GET /api/subscriptions/my-subscription
// @access  Private (Scrapper)
export const getMySubscription = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const result = await getScrapperSubscription(scrapperId);
  sendSuccess(res, 'Subscription retrieved successfully', {
    subscription: result.subscription,
    marketSubscription: result.marketSubscription
  });
});

// @desc    Subscribe to a plan (create payment order)
// @route   POST /api/subscriptions/subscribe
// @access  Private (Scrapper)
export const subscribe = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const scrapperId = req.user.id;

  if (!planId) {
    return sendError(res, 'Plan ID is required', 400);
  }

  // Verify scrapper exists
  const scrapper = await Scrapper.findById(scrapperId);
  if (!scrapper) {
    return sendError(res, 'Scrapper not found', 404);
  }

  // Get plan details
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) {
    return sendError(res, 'Plan not found or inactive', 404);
  }

  // Determine target subscription based on plan type
  const targetSub = plan.type === 'market_price' ? scrapper.marketSubscription : scrapper.subscription;

  // Check if scrapper already has active subscription of this type
  if (targetSub && targetSub.status === 'active') {
    const expiryDate = targetSub.expiryDate
      ? new Date(targetSub.expiryDate)
      : null;
    const now = new Date();

    if (expiryDate && expiryDate > now) {
      return sendError(res, `You already have an active ${plan.type === 'market_price' ? 'Market Price' : 'Platform'} subscription. Please renew or cancel it first.`, 400);
    }
  }

  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.error('[Subscription] Razorpay keys not configured');
    return sendError(res, 'Payment gateway not configured. Please contact support.', 500);
  }

  const keyId = process.env.RAZORPAY_KEY_ID;

  // Create Razorpay order
  let razorpayOrder;
  try {
    const receiptId = `sub_${scrapperId}_${Date.now()}`.slice(0, 40);
    const notes = {
      entityType: 'subscription',
      scrapperId: scrapperId.toString(),
      planId: planId.toString(),
      planName: plan.name,
      planType: plan.type, // Store type in notes
      durationDays: plan.getDurationInDays()
    };

    razorpayOrder = await createOrder(plan.price, plan.currency || 'INR', receiptId, notes);
  } catch (error) {
    logger.error('[Subscription] Razorpay order creation error:', error);
    return sendError(res, 'Failed to create payment order. Please try again.', 500);
  }

  // Create payment record
  const payment = await Payment.create({
    user: scrapperId,
    order: null, // No order for subscription
    entityType: 'subscription',
    amount: plan.price,
    currency: plan.currency || 'INR',
    status: PAYMENT_STATUS.PENDING,
    razorpayOrderId: razorpayOrder.id,
    planId: planId,
    durationDays: plan.getDurationInDays(),
    notes: JSON.stringify({
      planName: plan.name,
      planType: plan.type,
      planDuration: plan.durationType
    })
  });

  logger.info(`[Subscription] Payment order created for scrapper ${scrapperId}, plan: ${plan.name} (${plan.type})`);

  sendSuccess(res, 'Payment order created successfully', {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId,
    paymentId: payment._id,
    plan: {
      id: plan._id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      durationType: plan.durationType,
      type: plan.type
    }
  });
});

// @desc    Verify subscription payment and activate subscription
// @route   POST /api/subscriptions/verify-payment
// @access  Private (Scrapper)
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const scrapperId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return sendError(res, 'Payment details are required', 400);
  }

  // Find payment record
  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
    user: scrapperId,
    entityType: 'subscription'
  });

  if (!payment) {
    return sendError(res, 'Payment record not found', 404);
  }

  if (payment.status === PAYMENT_STATUS.COMPLETED) {
    // Payment already verified, return subscription
    const result = await getScrapperSubscription(scrapperId);
    return sendSuccess(res, 'Payment already verified', {
      subscription: result.subscription,
      payment
    });
  }

  // Verify payment signature
  if (razorpay_signature) {
    const crypto = await import('crypto');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn('[Subscription] Payment signature verification failed, trying API verification');
    }
  }

  // Verify payment via Razorpay API
  try {
    const { verifyPayment } = await import('../services/paymentService.js');
    const verificationResult = await verifyPayment(razorpay_order_id);

    if (!verificationResult.success || !verificationResult.payment) {
      return sendError(res, 'Payment not completed. Please complete the payment.', 400);
    }

    // Update payment record
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature || null;
    payment.transactionId = verificationResult.paymentId;
    payment.paidAt = new Date();
    await payment.save();

    // Activate subscription
    const subscriptionResult = await activateSubscription(scrapperId, payment._id);

    logger.info(`[Subscription] Subscription activated for scrapper ${scrapperId}`);

    sendSuccess(res, 'Subscription activated successfully', {
      subscription: subscriptionResult.subscription,
      plan: subscriptionResult.plan,
      payment
    });
  } catch (error) {
    logger.error('[Subscription] Payment verification error:', error);
    return sendError(res, 'Failed to verify payment. Please try again.', 500);
  }
});

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private (Scrapper)
export const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const scrapperId = req.user.id;

  const result = await cancelSubscription(scrapperId, reason);
  sendSuccess(res, 'Subscription cancelled successfully', { subscription: result.subscription });
});

// @desc    Renew subscription (manual renewal - creates new payment order)
// @route   POST /api/subscriptions/renew
// @access  Private (Scrapper)
export const renew = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const scrapperId = req.user.id;

  if (!planId) {
    return sendError(res, 'Plan ID is required', 400);
  }

  // Get plan details
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) {
    return sendError(res, 'Plan not found or inactive', 404);
  }

  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return sendError(res, 'Payment gateway not configured. Please contact support.', 500);
  }

  const keyId = process.env.RAZORPAY_KEY_ID;

  // Create Razorpay order
  let razorpayOrder;
  try {
    const receiptId = `renew_${scrapperId}_${Date.now()}`.slice(0, 40);
    const notes = {
      entityType: 'subscription',
      scrapperId: scrapperId.toString(),
      planId: planId.toString(),
      planName: plan.name,
      durationDays: plan.getDurationInDays(),
      action: 'renewal'
    };

    razorpayOrder = await createOrder(plan.price, plan.currency || 'INR', receiptId, notes);
  } catch (error) {
    logger.error('[Subscription] Razorpay order creation error:', error);
    return sendError(res, 'Failed to create payment order. Please try again.', 500);
  }

  // Create payment record
  const payment = await Payment.create({
    user: scrapperId,
    order: null,
    entityType: 'subscription',
    amount: plan.price,
    currency: plan.currency || 'INR',
    status: PAYMENT_STATUS.PENDING,
    razorpayOrderId: razorpayOrder.id,
    planId: planId,
    durationDays: plan.getDurationInDays(),
    notes: JSON.stringify({
      planName: plan.name,
      planDuration: plan.durationType,
      action: 'renewal'
    })
  });

  sendSuccess(res, 'Renewal payment order created successfully', {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId,
    paymentId: payment._id,
    plan: {
      id: plan._id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      durationType: plan.durationType
    }
  });
});

// @desc    Get subscription history
// @route   GET /api/subscriptions/history
// @access  Private (Scrapper)
export const getHistory = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const result = await getSubscriptionHistory(scrapperId);
  sendSuccess(res, 'Subscription history retrieved successfully', {
    subscription: result.subscription,
    history: result.history
  });
});





