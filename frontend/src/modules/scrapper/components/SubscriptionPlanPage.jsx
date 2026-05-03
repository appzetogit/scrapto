import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { checkAndProcessMilestone } from '../../shared/utils/referralUtils';
import { subscriptionAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const SubscriptionPlanPage = () => {
  const staticTexts = [
    "Loading subscription plans...",
    "Error loading subscription plans",
    "Retry",
    "Manage Your Subscription",
    "Choose Your Plan",
    "Your subscription is active. You can renew or change your plan below.",
    "Select a subscription plan to start receiving pickup requests",
    "Current Subscription: {plan}",
    "Expires: {date}",
    "Active",
    "Popular",
    "Selected",
    "Processing...",
    "Subscribe - ₹{price}/{duration}",
    "Subscription Details",
    "Subscription will auto-renew every month",
    "You can cancel anytime from your profile",
    "Payment will be processed securely via Razorpay",
    "All plans include full access to pickup requests",
    "Please select a subscription plan",
    "Subscription activated successfully!",
    "Payment verification failed. Please contact support.",
    "Failed to initiate payment. Please try again.",
    "month",
    "months",
    "year",
    "years",
    "days",
    "Platform Access",
    "Market Prices",
    "All plans include full access to live market rates"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') === 'market_price' ? 'market_price' : 'general';
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [planType, setPlanType] = useState(initialType);

  // Check if user is authenticated as scrapper
  useEffect(() => {
    const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
    const scrapperUser = localStorage.getItem('scrapperUser');
    if (scrapperAuth !== 'true' || !scrapperUser) {
      navigate('/scrapper/login', { replace: true });
    }
  }, [navigate]);

  // Fetch plans and current subscription
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch plans
        const plansRes = await subscriptionAPI.getPlans();
        if (plansRes.success) {
          // Transform plans for display
          const transformedPlans = plansRes.data.plans.map(plan => ({
            id: plan._id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency || 'INR',
            duration: plan.duration,
            durationType: plan.durationType,
            features: plan.features || [],
            maxPickups: plan.maxPickups,
            isPopular: plan.isPopular || false,
            type: plan.type || 'general' // Include type
          }));
          setPlans(transformedPlans);
        }

        // Fetch current subscription
        try {
          const subRes = await subscriptionAPI.getMySubscription();
          if (subRes.success) {
            // Store full response to handle both types
            const { subscription, marketSubscription } = subRes.data;
            setCurrentSubscription({
              general: subscription,
              market_price: marketSubscription
            });

            // Update localStorage - storing generic status might be tricky now
            // For backward compatibility, store general status
            if (subscription?.status === 'active') {
              localStorage.setItem('scrapperSubscriptionStatus', 'active');
            }
            return subRes.data; // Return data for use in handleSubscribe if needed
          }
        } catch (subError) {
          console.log('No active subscription found');
        }
        return null;
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError(err.message || 'Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to get active sub for current tab
  const activeSubForTab = currentSubscription?.[planType];
  const isTabActive = activeSubForTab?.status === 'active' && new Date(activeSubForTab.expiryDate) > new Date();



  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const loadRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedPlan) {
      alert(getTranslatedText('Please select a subscription plan'));
      return;
    }

    if (isProcessing) {
      return; // Prevent double submission
    }

    setIsProcessing(true);

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');

    try {
      await loadRazorpay();

      // Use new subscription API
      const createRes = await subscriptionAPI.subscribe(selectedPlan);

      if (!createRes.success) {
        throw new Error(createRes.error || 'Failed to create subscription order');
      }

      const { razorpayOrderId, amount, currency, keyId, paymentId, plan } = createRes.data;

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'Scraptox',
        description: `${selectedPlanData.name} - ${selectedPlanData.durationType || 'monthly'} subscription`,
        order_id: razorpayOrderId,
        prefill: {
          name: scrapperUser.name || 'Scrapper',
          email: scrapperUser.email || 'scrapper@example.com',
          contact: scrapperUser.phone || ''
        },
        handler: async (response) => {
          try {
            // Use new subscription API for verification
            const verifyRes = await subscriptionAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (!verifyRes.success) {
              throw new Error(verifyRes.error || 'Payment verification failed');
            }

            // Update localStorage with subscription data
            const subscription = verifyRes.data.subscription;
            localStorage.setItem('scrapperSubscriptionStatus', 'active');
            localStorage.setItem('scrapperSubscription', JSON.stringify({
              status: subscription.status,
              planId: subscription.planId?._id || subscription.planId,
              planName: verifyRes.data.plan?.name || selectedPlanData.name,
              startDate: subscription.startDate,
              expiryDate: subscription.expiryDate,
              autoRenew: subscription.autoRenew
            }));

            try {
              checkAndProcessMilestone(scrapperUser.phone || scrapperUser.id, 'scrapper', 'subscription');
            } catch (err) {
              console.error('Error processing milestone:', err);
            }

            // Show success toast or state before navigating
            toast.success(getTranslatedText('Subscription activated successfully!'));
            
            // Short delay to let the user see success before redirecting
            setTimeout(() => {
              navigate('/scrapper/dashboard', { replace: true });
            }, 1500);
          } catch (err) {
            console.error('Verification failed', err);
            alert(err.message || getTranslatedText('Payment verification failed. Please contact support.'));
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        notes: {
          plan: selectedPlanData.name,
          entityType: 'subscription'
        },
        theme: {
          color: '#64946e'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Subscription payment error:', error);
      alert(error.message || getTranslatedText('Failed to initiate payment. Please try again.'));
      setIsProcessing(false);
    }
  };

  // Format duration display
  const formatDuration = (duration, durationType) => {
    if (durationType === 'monthly') {
      return duration === 1 ? getTranslatedText('month') : `${duration} ${getTranslatedText('months')}`;
    } else if (durationType === 'quarterly') {
      return `${duration} ${getTranslatedText('months')}`;
    } else if (durationType === 'yearly') {
      return duration === 12 ? getTranslatedText('year') : `${duration / 12} ${getTranslatedText('years')}`;
    }
    return `${duration} ${getTranslatedText('days')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-green-500 mx-auto mb-4"
          />
          <p className="text-gray-400">{getTranslatedText("Loading subscription plans...")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full p-4 md:p-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 text-center">
            <p className="text-red-400 mb-2">{getTranslatedText("Error loading subscription plans")}</p>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {getTranslatedText("Retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full p-4 md:p-6 bg-gradient-to-br from-zinc-900 via-gray-900 to-black"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            {isTabActive 
              ? getTranslatedText('Manage Your Subscription') 
              : (queryParams.has('type') 
                  ? (planType === 'market_price' ? getTranslatedText("Market Prices") : getTranslatedText("Platform Access"))
                  : getTranslatedText('Choose Your Plan')
                )
            }
          </h1>
          {!queryParams.has('type') && (
            <div className="flex justify-center gap-4 mt-4 mb-6">
              <button
                onClick={() => { setPlanType('general'); setSelectedPlan(null); }}
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${planType === 'general' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-gray-400'}`}
              >
                {getTranslatedText("Platform Access")}
              </button>
              <button
                onClick={() => { setPlanType('market_price'); setSelectedPlan(null); }}
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${planType === 'market_price' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-gray-400'}`}
              >
                {getTranslatedText("Market Prices")}
              </button>
            </div>
          )}
        </motion.div>

        {/* Current Subscription Info */}
        {isTabActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl p-8 shadow-2xl bg-zinc-900 border-2 border-emerald-500 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-3xl -ml-16 -mb-16 rounded-full" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
                    {getTranslatedText("Active")}
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-1 text-white uppercase tracking-tight">
                  {activeSubForTab.planId?.name || 'Your Active Plan'}
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  {getTranslatedText("Expires: {date}", { date: activeSubForTab.expiryDate ? new Date(activeSubForTab.expiryDate).toLocaleDateString() : 'N/A' })}
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/scrapper/dashboard')}
                className="w-full md:w-auto px-10 py-4 rounded-2xl font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3"
              >
                <span>CONTINUE TO DASHBOARD</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {plans.filter(p => (p.type || 'general') === planType).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={() => handlePlanSelect(plan.id)}
              className={`relative rounded-2xl p-6 md:p-8 shadow-lg cursor-pointer transition-all duration-300 bg-zinc-900 ${selectedPlan === plan.id ? 'ring-4 ring-emerald-500 border-emerald-500' : 'hover:shadow-xl border-white/10 border'
                }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  {getTranslatedText("Popular")}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-bold text-emerald-400">
                    ₹{plan.price}
                  </span>
                  <span className="text-sm md:text-base text-gray-400">
                    /{formatDuration(plan.duration, plan.durationType)}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5 text-emerald-400">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm md:text-base text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Selection Indicator */}
              {selectedPlan === plan.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-full py-2 rounded-lg text-center font-semibold bg-emerald-900/30 text-emerald-400"
                >
                  {getTranslatedText("Selected")}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Subscribe Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubscribe(e);
            }}
            disabled={!selectedPlan || isProcessing}
            className="w-full py-4 md:py-5 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                />
                <span>{getTranslatedText("Processing...")}</span>
              </div>
            ) : (
              `${getTranslatedText("Subscribe")} - ₹${selectedPlan ? plans.find(p => p.id === selectedPlan).price : '0'}/${selectedPlan ? formatDuration(plans.find(p => p.id === selectedPlan).duration, plans.find(p => p.id === selectedPlan).durationType) : getTranslatedText('month')}`
            )}
          </motion.button>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl p-4 md:p-6 shadow-lg bg-zinc-900"
        >
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0 mt-0.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
            </svg>
            <div>
              <p className="text-sm font-semibold mb-2 text-white">
                {getTranslatedText("Subscription Details")}
              </p>
              <ul className="text-xs md:text-sm space-y-1 text-gray-400">
                <li>• {getTranslatedText("Subscription will auto-renew every month")}</li>
                <li>• {getTranslatedText("You can cancel anytime from your profile")}</li>
                <li>• {getTranslatedText("Payment will be processed securely via Razorpay")}</li>
                <li>• {planType === 'market_price' ? getTranslatedText("All plans include full access to live market rates") : getTranslatedText("All plans include full access to pickup requests")}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SubscriptionPlanPage;

