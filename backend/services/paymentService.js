import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Get Razorpay client instance
 * Same pattern as createbharat project
 */
export const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are not set. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }

  // Validate key format (Razorpay keys usually start with 'rzp_')
  if (!key_id.startsWith('rzp_')) {
    logger.warn('[Razorpay] Warning: Key ID does not start with "rzp_". Please verify your RAZORPAY_KEY_ID.');
  }

  try {
    const razorpay = new Razorpay({ 
      key_id: key_id.trim(), 
      key_secret: key_secret.trim() 
    });
    
    return razorpay;
  } catch (initError) {
    logger.error('[Razorpay] Client initialization error:', initError);
    throw new Error('Failed to initialize Razorpay client. Please check your API keys.');
  }
};

// Create Razorpay order
export const createOrder = async (amount, currency = 'INR', receipt = null, notes = {}) => {
  try {
    const razorpay = getRazorpayClient();
    
    // Generate receipt if not provided (max 40 characters for Razorpay)
    const receiptId = receipt || `scrapto_${Date.now()}`.slice(0, 40);
    
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receiptId,
      payment_capture: 1, // Auto-capture payment
      notes: notes
    };

    logger.info('[Razorpay] Creating order:', { amount, currency, receipt: receiptId });
    
    const order = await razorpay.orders.create(options);
    
    logger.info('[Razorpay] Order created successfully:', order.id);
    return order;
  } catch (error) {
    logger.error('[Razorpay] Error creating order:', error);
    throw error;
  }
};

// Verify payment signature
export const verifyPaymentSignature = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;
  
  if (!isAuthentic) {
    logger.warn('[Razorpay] Payment signature verification failed');
  }
  
  return isAuthentic;
};

// Fetch payment details from Razorpay
export const fetchPayment = async (paymentId) => {
  try {
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error('[Razorpay] Error fetching payment:', error);
    throw error;
  }
};

// Fetch order details from Razorpay
export const fetchOrder = async (orderId) => {
  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    logger.error('[Razorpay] Error fetching order:', error);
    throw error;
  }
};

// Verify payment by fetching from Razorpay API
export const verifyPayment = async (orderId) => {
  try {
    const razorpay = getRazorpayClient();
    
    // Fetch order from Razorpay
    const order = await razorpay.orders.fetch(orderId);
    
    let payment = null;
    let paymentId = null;

    // Check if order has payments array
    if (order && order.payments && order.payments.length > 0) {
      paymentId = order.payments[0];
      payment = await razorpay.payments.fetch(paymentId);
    } else {
      // Try to fetch payments using payments API
      try {
        const payments = await razorpay.payments.all({
          'order_id': orderId
        });
        
        if (payments && payments.items && payments.items.length > 0) {
          payment = payments.items.find(p => 
            p.status === 'captured' || p.status === 'authorized'
          ) || payments.items[0];
          paymentId = payment.id;
        }
      } catch (paymentsApiError) {
        logger.error('[Razorpay] Error fetching payments via API:', paymentsApiError);
      }
    }

    if (payment && paymentId) {
      // Check if payment is actually captured/authorized
      const isCaptured = payment.status === 'captured' || 
                        payment.status === 'authorized' || 
                        payment.captured === true ||
                        (payment.amount_captured && payment.amount_captured > 0);
      
      return {
        success: isCaptured,
        payment,
        paymentId,
        order,
        status: payment.status
      };
    }

    return {
      success: false,
      payment: null,
      paymentId: null,
      order,
      status: order.status || 'unknown'
    };
  } catch (error) {
    logger.error('[Razorpay] Error verifying payment:', error);
    throw error;
  }
};

// Refund payment
export const refundPayment = async (paymentId, amount = null) => {
  try {
    const razorpay = getRazorpayClient();
    const options = amount ? { amount: Math.round(amount * 100) } : {};
    const refund = await razorpay.payments.refund(paymentId, options);
    logger.info('[Razorpay] Payment refunded:', refund.id);
    return refund;
  } catch (error) {
    logger.error('[Razorpay] Error refunding payment:', error);
    throw error;
  }
};

// Create payment link (for WebView support)
export const createPaymentLink = async (amount, currency = 'INR', description, callbackUrl, notes = {}) => {
  try {
    const razorpay = getRazorpayClient();
    
    const paymentLinkOptions = {
      amount: Math.round(amount * 100),
      currency,
      description: description || 'Scrapto Payment',
      callback_url: callbackUrl,
      callback_method: 'get',
      notes: notes
    };

    logger.info('[Razorpay] Creating payment link:', { amount, currency, description });
    
    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);
    
    if (!paymentLink || !paymentLink.id || !paymentLink.short_url) {
      throw new Error('Invalid payment link response from Razorpay');
    }

    logger.info('[Razorpay] Payment link created:', paymentLink.id);
    return paymentLink;
  } catch (error) {
    logger.error('[Razorpay] Error creating payment link:', error);
    throw error;
  }
};

