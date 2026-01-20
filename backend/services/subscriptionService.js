import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Scrapper from '../models/Scrapper.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';

/**
 * Get all active subscription plans
 */
export const getActivePlans = async () => {
  try {
    const plans = await SubscriptionPlan.getActivePlans();
    return {
      success: true,
      plans
    };
  } catch (error) {
    logger.error('[Subscription] Error fetching active plans:', error);
    throw error;
  }
};

/**
 * Get plan by ID (only if active)
 */
export const getPlanById = async (planId) => {
  try {
    const plan = await SubscriptionPlan.getActivePlanById(planId);
    if (!plan) {
      throw new Error('Plan not found or inactive');
    }
    return {
      success: true,
      plan
    };
  } catch (error) {
    logger.error('[Subscription] Error fetching plan:', error);
    throw error;
  }
};

/**
 * Calculate expiry date based on start date and duration
 */
export const calculateExpiryDate = (startDate, durationDays) => {
  const start = new Date(startDate);
  const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
  return expiry;
};

/**
 * Create subscription for scrapper
 * This is called after payment verification
 */
export const createSubscription = async (scrapperId, planId, paymentData) => {
  try {
    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
      throw new Error('Scrapper not found');
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new Error('Plan not found or inactive');
    }

    // Determine target field based on plan type
    const targetField = plan.type === 'market_price' ? 'marketSubscription' : 'subscription';

    // Calculate dates
    const startDate = new Date();
    const durationDays = plan.getDurationInDays();
    const expiryDate = calculateExpiryDate(startDate, durationDays);

    // Cancel previous subscription if exists (for renewal)
    if (scrapper[targetField].status === 'active') {
      scrapper[targetField].status = 'cancelled';
      scrapper[targetField].cancelledAt = new Date();
    }

    // Create new subscription
    scrapper[targetField].status = 'active';
    scrapper[targetField].planId = planId;
    scrapper[targetField].startDate = startDate;
    scrapper[targetField].expiryDate = expiryDate;
    scrapper[targetField].razorpaySubscriptionId = paymentData.razorpayOrderId || null;
    scrapper[targetField].razorpayPaymentId = paymentData.razorpayPaymentId || null;
    scrapper[targetField].autoRenew = true; // Default to auto-renew
    scrapper[targetField].cancelledAt = null;
    scrapper[targetField].cancellationReason = null;

    await scrapper.save();

    logger.info(`[Subscription] ${plan.type} Subscription created for scrapper ${scrapperId}, plan: ${plan.name}`);

    return {
      success: true,
      subscription: scrapper[targetField],
      plan
    };
  } catch (error) {
    logger.error('[Subscription] Error creating subscription:', error);
    throw error;
  }
};

/**
 * Activate subscription after payment verification
 */
export const activateSubscription = async (scrapperId, paymentId) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.entityType !== 'subscription') {
      throw new Error('Payment is not for subscription');
    }

    const planId = payment.planId;
    if (!planId) {
      throw new Error('Plan ID not found in payment');
    }

    const paymentData = {
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId
    };

    return await createSubscription(scrapperId, planId, paymentData);
  } catch (error) {
    logger.error('[Subscription] Error activating subscription:', error);
    throw error;
  }
};

/**
 * Get scrapper's current subscription
 */
/**
 * Get scrapper's current subscription
 */
export const getScrapperSubscription = async (scrapperId) => {
  try {
    const scrapper = await Scrapper.findById(scrapperId)
      .populate('subscription.planId', 'name price duration durationType features maxPickups type')
      .populate('marketSubscription.planId', 'name price duration durationType features maxPickups type');

    if (!scrapper) {
      throw new Error('Scrapper not found');
    }

    const now = new Date();
    let updated = false;

    // Check if platform subscription is expired
    if (scrapper.subscription.status === 'active' && scrapper.subscription.expiryDate) {
      const expiryDate = new Date(scrapper.subscription.expiryDate);
      if (expiryDate < now) {
        scrapper.subscription.status = 'expired';
        updated = true;
      }
    }

    // Check if market subscription is expired
    if (scrapper.marketSubscription && scrapper.marketSubscription.status === 'active' && scrapper.marketSubscription.expiryDate) {
      const expiryDate = new Date(scrapper.marketSubscription.expiryDate);
      if (expiryDate < now) {
        scrapper.marketSubscription.status = 'expired';
        updated = true;
      }
    }

    if (updated) {
      await scrapper.save();
    }

    return {
      success: true,
      subscription: scrapper.subscription,
      marketSubscription: scrapper.marketSubscription
    };
  } catch (error) {
    logger.error('[Subscription] Error fetching scrapper subscription:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (scrapperId, reason = null) => {
  try {
    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
      throw new Error('Scrapper not found');
    }

    if (scrapper.subscription.status !== 'active') {
      throw new Error('No active subscription to cancel');
    }

    // Mark as cancelled (but keep active until expiry)
    scrapper.subscription.status = 'cancelled';
    scrapper.subscription.autoRenew = false;
    scrapper.subscription.cancelledAt = new Date();
    scrapper.subscription.cancellationReason = reason || 'User cancelled';

    await scrapper.save();

    logger.info(`[Subscription] Subscription cancelled for scrapper ${scrapperId}`);

    return {
      success: true,
      subscription: scrapper.subscription
    };
  } catch (error) {
    logger.error('[Subscription] Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Renew subscription (manual renewal)
 */
export const renewSubscription = async (scrapperId, planId) => {
  try {
    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
      throw new Error('Scrapper not found');
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new Error('Plan not found or inactive');
    }

    // Calculate new expiry date
    const now = new Date();
    const currentExpiry = scrapper.subscription.expiryDate
      ? new Date(scrapper.subscription.expiryDate)
      : now;

    // If current subscription is still active, extend from expiry date
    // Otherwise, start from now
    const startDate = currentExpiry > now ? currentExpiry : now;
    const durationDays = plan.getDurationInDays();
    const newExpiryDate = calculateExpiryDate(startDate, durationDays);

    // Update subscription
    scrapper.subscription.status = 'active';
    scrapper.subscription.planId = planId;
    scrapper.subscription.startDate = scrapper.subscription.startDate || startDate;
    scrapper.subscription.expiryDate = newExpiryDate;
    scrapper.subscription.autoRenew = true;
    scrapper.subscription.cancelledAt = null;
    scrapper.subscription.cancellationReason = null;

    await scrapper.save();

    logger.info(`[Subscription] Subscription renewed for scrapper ${scrapperId}, plan: ${plan.name}`);

    return {
      success: true,
      subscription: scrapper.subscription,
      plan
    };
  } catch (error) {
    logger.error('[Subscription] Error renewing subscription:', error);
    throw error;
  }
};

/**
 * Check and update expired subscriptions
 * This should be called by a cron job daily
 */
export const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    const expiredScrappers = await Scrapper.find({
      'subscription.status': 'active',
      'subscription.expiryDate': { $lt: now }
    });

    if (expiredScrappers.length === 0) {
      return {
        success: true,
        expiredCount: 0,
        message: 'No expired subscriptions found'
      };
    }

    // Update all expired subscriptions
    const updateResult = await Scrapper.updateMany(
      {
        'subscription.status': 'active',
        'subscription.expiryDate': { $lt: now }
      },
      {
        $set: {
          'subscription.status': 'expired'
        }
      }
    );

    logger.info(`[Subscription] Marked ${updateResult.modifiedCount} subscriptions as expired`);

    return {
      success: true,
      expiredCount: updateResult.modifiedCount,
      message: `Marked ${updateResult.modifiedCount} subscriptions as expired`
    };
  } catch (error) {
    logger.error('[Subscription] Error checking expired subscriptions:', error);
    throw error;
  }
};

/**
 * Get subscription history for scrapper
 */
export const getSubscriptionHistory = async (scrapperId) => {
  try {
    // For now, we only have current subscription
    // In future, we can add a SubscriptionHistory model
    const scrapper = await Scrapper.findById(scrapperId)
      .populate('subscription.planId', 'name price duration durationType');

    if (!scrapper) {
      throw new Error('Scrapper not found');
    }

    return {
      success: true,
      subscription: scrapper.subscription,
      history: [] // Placeholder for future subscription history
    };
  } catch (error) {
    logger.error('[Subscription] Error fetching subscription history:', error);
    throw error;
  }
};





