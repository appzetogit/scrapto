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
import Coupon from '../models/CouponModel.js';
import CouponUsage from '../models/CouponUsageModel.js';
import { PAYMENT_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

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
  const { planId, couponCode } = req.body;
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

  // Handle Coupons
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) {
      return sendError(res, 'Invalid coupon code', 400);
    }

    // Basic Validation
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return sendError(res, 'Coupon is not valid at this time', 400);
    }

    if (coupon.applicableRole !== 'ALL' && coupon.applicableRole !== 'SCRAPPER') {
      return sendError(res, 'Coupon not applicable for your role', 400);
    }

    if (coupon.usageType === 'LIMITED' && coupon.usedCount >= coupon.limit) {
      return sendError(res, 'Coupon usage limit reached', 400);
    }

    // Check if user already used this coupon
    const existingUsage = await CouponUsage.findOne({ couponId: coupon._id, scrapperId });
    if (existingUsage) {
      return sendError(res, 'You have already used this coupon', 400);
    }

    discountAmount = coupon.amount;
    appliedCoupon = coupon;
  }

  const finalPrice = Math.max(0, plan.price - discountAmount);

  // Handle Free Plans (Price = 0)
  if (finalPrice === 0) {
    logger.info(`[Subscription] Activating free plan (or 100% discount) for scrapper ${scrapperId}: ${plan.name}`);
    
    // Create a completed payment record for the free plan
    const payment = await Payment.create({
      user: scrapperId,
      entityType: 'subscription',
      amount: 0,
      currency: plan.currency || 'INR',
      status: PAYMENT_STATUS.COMPLETED,
      planId: planId,
      durationDays: plan.getDurationInDays(),
      paidAt: new Date(),
      notes: JSON.stringify({
        planName: plan.name,
        planType: plan.type,
        planDuration: plan.durationType,
        isFree: plan.price === 0,
        couponApplied: !!appliedCoupon,
        couponCode: appliedCoupon?.code,
        originalPrice: plan.price,
        discountAmount
      })
    });

    // Record Coupon Usage if applied
    if (appliedCoupon) {
      await CouponUsage.create({
        couponId: appliedCoupon._id,
        scrapperId,
        userType: 'Scrapper',
        amount: discountAmount
      });
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    // Activate subscription immediately
    const subscriptionResult = await activateSubscription(scrapperId, payment._id);

    return sendSuccess(res, 'Free subscription activated successfully', {
      subscription: subscriptionResult.subscription,
      plan: subscriptionResult.plan,
      payment
    });
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
      durationDays: plan.getDurationInDays(),
      couponCode: appliedCoupon?.code,
      discountAmount
    };

    razorpayOrder = await createOrder(finalPrice, plan.currency || 'INR', receiptId, notes);
  } catch (error) {
    logger.error('[Subscription] Razorpay order creation error:', error);
    return sendError(res, 'Failed to create payment order. Please try again.', 500);
  }

  // Create payment record
  const payment = await Payment.create({
    user: scrapperId,
    order: null, // No order for subscription
    entityType: 'subscription',
    amount: finalPrice,
    originalAmount: plan.price,
    discountAmount: discountAmount,
    couponCode: appliedCoupon?.code,
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
      finalPrice: finalPrice,
      discountAmount: discountAmount,
      duration: plan.duration,
      durationType: plan.durationType,
      type: plan.type
    }
  });
});

// @desc    Validate coupon for subscription
// @route   POST /api/subscriptions/validate-coupon
// @access  Private (Scrapper)
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, planId } = req.body;
  const scrapperId = req.user.id;

  if (!code) {
    return sendError(res, 'Coupon code is required', 400);
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    return sendError(res, 'Invalid coupon code', 400);
  }

  // Basic Validation
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTo) {
    return sendError(res, 'Coupon has expired or is not yet valid', 400);
  }

  if (coupon.applicableRole !== 'ALL' && coupon.applicableRole !== 'SCRAPPER') {
    return sendError(res, 'This coupon is not applicable for your account type', 400);
  }

  if (coupon.usageType === 'LIMITED' && coupon.usedCount >= coupon.limit) {
    return sendError(res, 'This coupon has reached its usage limit', 400);
  }

  // Check if user already used this coupon
  const existingUsage = await CouponUsage.findOne({ couponId: coupon._id, scrapperId });
  if (existingUsage) {
    return sendError(res, 'You have already redeemed this coupon', 400);
  }

  // Get plan details to calculate discount (optional if we just want to return coupon amount)
  let plan = null;
  if (planId) {
    plan = await SubscriptionPlan.findById(planId);
  }

  sendSuccess(res, 'Coupon is valid', {
    code: coupon.code,
    amount: coupon.amount,
    title: coupon.title,
    discountedPrice: plan ? Math.max(0, plan.price - coupon.amount) : null
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

    // --- NOTIFY SCRAPPER ---
    const { sendNotificationToUser } = await import('../utils/pushNotificationHelper.js');
    sendNotificationToUser(scrapperId, {
      title: 'Subscription Active! 🚀',
      body: `Your ${subscriptionResult.plan?.name || 'subscription'} is now active until ${new Date(subscriptionResult.subscription.expiryDate).toLocaleDateString()}.`,
      data: { type: 'subscription_active' }
    });

    // If coupon was used, record usage (for non-free plans)
    if (payment.couponCode) {
      const coupon = await Coupon.findOne({ code: payment.couponCode.toUpperCase() });
      if (coupon) {
        // Check if usage already recorded (to avoid double recording on retry)
        const existingUsage = await CouponUsage.findOne({ 
          couponId: coupon._id, 
          scrapperId: scrapperId,
          paymentId: payment._id 
        });

        if (!existingUsage) {
          await CouponUsage.create({
            couponId: coupon._id,
            scrapperId: scrapperId,
            userType: 'Scrapper',
            paymentId: payment._id,
            amount: payment.discountAmount || 0
          });
          
          // Increment used count
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await coupon.save();
          logger.info(`[Subscription] Coupon ${coupon.code} usage recorded for scrapper ${scrapperId}`);
        }
      }
    }

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
  const { reason, type = 'general' } = req.body;
  const scrapperId = req.user.id;

  const result = await cancelSubscription(scrapperId, type, reason);
  sendSuccess(res, 'Subscription cancelled successfully', { subscription: result.subscription });
});

// @desc    Renew subscription (manual renewal - creates new payment order)
// @route   POST /api/subscriptions/renew
// @access  Private (Scrapper)
export const renew = asyncHandler(async (req, res) => {
  const { planId, couponCode } = req.body;
  const scrapperId = req.user.id;

  if (!planId) {
    return sendError(res, 'Plan ID is required', 400);
  }

  // Get plan details
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) {
    return sendError(res, 'Plan not found or inactive', 404);
  }

  // Handle Coupons
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      // Basic Validation
      const now = new Date();
      const isValid = now >= coupon.validFrom && now <= coupon.validTo;
      const isRoleValid = coupon.applicableRole === 'ALL' || coupon.applicableRole === 'SCRAPPER';
      const isLimitValid = coupon.usageType !== 'LIMITED' || coupon.usedCount < coupon.limit;

      if (isValid && isRoleValid && isLimitValid) {
        const existingUsage = await CouponUsage.findOne({ couponId: coupon._id, scrapperId });
        if (!existingUsage) {
          discountAmount = coupon.amount;
          appliedCoupon = coupon;
        }
      }
    }
  }

  const finalPrice = Math.max(0, plan.price - discountAmount);

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
      action: 'renewal',
      couponCode: appliedCoupon?.code,
      discountAmount
    };

    razorpayOrder = await createOrder(finalPrice, plan.currency || 'INR', receiptId, notes);
  } catch (error) {
    logger.error('[Subscription] Razorpay order creation error:', error);
    return sendError(res, 'Failed to create payment order. Please try again.', 500);
  }

  // Create payment record
  const payment = await Payment.create({
    user: scrapperId,
    order: null,
    entityType: 'subscription',
    status: PAYMENT_STATUS.PENDING,
    razorpayOrderId: razorpayOrder.id,
    planId: planId,
    amount: finalPrice,
    originalAmount: plan.price,
    discountAmount: discountAmount,
    couponCode: appliedCoupon?.code,
    durationDays: plan.getDurationInDays(),
    notes: JSON.stringify({
      planName: plan.name,
      planDuration: plan.durationType,
      action: 'renewal',
      couponCode: appliedCoupon?.code,
      discountAmount
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
      finalPrice: finalPrice,
      discountAmount: discountAmount,
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





