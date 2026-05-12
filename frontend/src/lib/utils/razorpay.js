/**
 * Razorpay Payment Integration Utility
 * Handles Razorpay payment initialization and verification
 */

let razorpayLoaded = false;

const isProbablyWebView = () => {
  try {
    const ua = String(navigator?.userAgent || "");
    // Common WebView indicators:
    // - Android WebView: "; wv" or "Version/x.x" without Chrome brand
    // - iOS WebView: AppleWebKit but missing Safari
    const isAndroid = /Android/i.test(ua);
    const hasWv = /\bwv\b/i.test(ua);
    const hasVersion = /Version\/\d+/i.test(ua);
    const hasSafari = /Safari/i.test(ua);
    const isIOSWebView = /iPhone|iPad|iPod/i.test(ua) && !hasSafari;
    return (isAndroid && (hasWv || hasVersion)) || isIOSWebView;
  } catch {
    return false;
  }
};

/**
 * Load Razorpay checkout script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (razorpayLoaded) {
      resolve();
      return;
    }

    if (window.Razorpay) {
      razorpayLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      razorpayLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay payment
 * @param {Object} options - Payment options
 */
export const initRazorpayPayment = async (options) => {
  try {
    // Load Razorpay script if not already loaded
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not available');
    }

    const razorpayOptions = {
      key: options.key,
      amount: options.amount,
      currency: options.currency || 'INR',
      order_id: options.order_id,
      name: options.name || 'Scrapto',
      description: options.description || 'Payment',
      image: options.image || '/logo.png',
      // Explicitly enable UPI and other methods
      method: options.method || {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: true,
        paylater: true,
      },
      // Allow redirect/deep-link for UPI intent apps
      redirect: options.redirect ?? true,
      // Support UPI Intent inside Android WebView
      webview_intent: options.webview_intent ?? isProbablyWebView(),
      prefill: {
        name: options.prefill?.name || '',
        email: options.prefill?.email || '',
        contact: options.prefill?.contact || ''
      },
      notes: options.notes || {},
      theme: {
        color: options.theme?.color || '#10b981'
      },
      handler: function(response) {
        if (options.handler) {
          options.handler(response);
        }
      },
      modal: {
        ondismiss: function() {
          if (options.onClose) {
            options.onClose();
          }
        },
        escape: true,
        animation: true
      },
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    // Apply config.display to prioritize UPI (matching working App A behavior)
    // Custom config.display preference to ensure UPI apps list renders.
    razorpayOptions.config = options.config || {
      display: {
        blocks: {
          upi: {
            name: "UPI / Apps",
            instruments: [
              {
                method: "upi",
              },
            ],
          },
        },
        sequence: ["block.upi", "block.card", "block.netbanking", "block.wallet"],
        preferences: {
          show_default_blocks: true,
        },
      },
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    
    razorpay.on('payment.failed', function(response) {
      console.error('Razorpay payment failed:', response);
      if (options.onError) {
        options.onError(response.error || { description: 'Payment failed. Please try again.' });
      }
    });

    razorpay.open();
    
    console.log('✅ Razorpay checkout opened successfully');
    return razorpay;
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    if (options.onError) {
      options.onError(error);
    }
    throw error;
  }
};

/**
 * Format amount for display
 */
export const formatAmount = (amount) => {
  return `₹${(amount / 100).toFixed(2)}`;
};
