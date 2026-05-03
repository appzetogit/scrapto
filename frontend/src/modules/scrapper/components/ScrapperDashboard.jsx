import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { FaGift, FaChartLine, FaCheck } from 'react-icons/fa';
import PriceTicker from '../../user/components/PriceTicker';
import ScrapperSolutions from './ScrapperSolutions';
import { getActiveRequestsCount, getScrapperAssignedRequests, migrateOldActiveRequest } from '../../shared/utils/scrapperRequestUtils';
import { earningsAPI, scrapperOrdersAPI, subscriptionAPI, kycAPI, scrapperProfileAPI, getAuthToken } from '../../shared/utils/api';
import BannerSlider from '../../shared/components/BannerSlider';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import LanguageSelector from '../../shared/components/LanguageSelector';
import ScrapperBottomNav from './ScrapperBottomNav';
import siteLogo from '../../../assets/scraptox-removebg-preview.png';

const ScrapperDashboard = () => {
  const staticTexts = [
    "Loading dashboard...",
    "Welcome, {name}! 👋",
    "Ready to start earning?",
    "Available for Pickups",
    "Currently Offline",
    "You will receive requests",
    "Turn on to receive requests",
    "ON",
    "OFF",
    "Market Price Add‑On",
    "Unlock real‑time scrap rates",
    "View plans",
    "Earnings Summary",
    "Today",
    "This Week",
    "This Month",
    "Total",
    "Quick Stats",
    "Completed",
    "Rating",
    "Active",
    "Active Requests",
    "View All",
    "Unknown User",
    "Scrap",
    "Time not specified",
    "Accepted",
    "Picked Up",
    "Payment Pending",
    "View {count} more request",
    "View {count} more requests",
    "Subscription Status",
    "Active until {date}",
    "Recent Activity",
    "Order ID: {id}",
    "Estimated Earnings",
    "No activity recorded yet.",
    "Verified",
    "Pending",
    "Rejected",
    "Not Submitted",
    "Hi, Scrapper!",
    "Scrapper",
    "View Earnings",
    "Scrap Pickup",
    "User",
    "Invite scrappers and earn rewards",
    "Orders History",
    "order",
    "orders",
    "No Completed Orders Yet",
    "Your completed orders will appear here",
    "Completed on:",
    "Active subscription required to go online. Please subscribe first.",
    "No Subscription",
    "Take subscription to receive requests",
    "Subscribe Now",
    "Subscription Active",
    "Subscription Expired",
    "Renew Now",
    "Your Activity",
    "Upcoming Pickups",
    "Collectors",
    "Under Negotiation",
    "Open Items"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [kycStatus, setKycStatus] = useState(null); // Backend KYC status
  const [subscriptionData, setSubscriptionData] = useState(null); // Backend subscription data
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Load earnings and stats from localStorage
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });

  const [stats, setStats] = useState({
    completedPickups: 0,
    rating: 4.8,
    activeRequests: 0
  });
  const [marketSubStatus, setMarketSubStatus] = useState('inactive'); // for real-time market price subscription
  const [activityStats, setActivityStats] = useState({
    upcomingPickups: 0,
    collectors: 0,
    underNegotiation: 0,
    openItems: 0
  });

  const [completedOrders, setCompletedOrders] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);

  // Function to load and update dashboard data
  const loadDashboardData = async () => {
    try {
      // Load earnings from backend
      const earningsResponse = await earningsAPI.getSummary();
      if (earningsResponse.success && earningsResponse.data?.summary) {
        const summary = earningsResponse.data.summary;
        setEarnings({
          today: summary.today || 0,
          week: summary.week || 0,
          month: summary.month || 0,
          total: summary.total || 0
        });
        setStats(prev => ({
          ...prev,
          completedPickups: summary.completedOrders || 0,
          rating: summary.rating || 5.0
        }));
      } else {
        // Fallback to localStorage if backend fails
        const earningsData = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"today": 0, "week": 0, "month": 0, "total": 0}');
        setEarnings({
          today: earningsData.today || 0,
          week: earningsData.week || 0,
          month: earningsData.month || 0,
          total: earningsData.total || 0
        });
        // We persist stats in a separate key or just keep previous/default
      }
    } catch (error) {
      console.error('Failed to load earnings from backend:', error);
      // Fallback to localStorage
      const earningsData = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"today": 0, "week": 0, "month": 0, "total": 0}');
      setEarnings({
        today: earningsData.today || 0,
        week: earningsData.week || 0,
        month: earningsData.month || 0,
        total: earningsData.total || 0
      });
    }

    try {
      // Load completed orders from backend (earnings history)
      const historyResponse = await earningsAPI.getHistory('limit=100');
      if (historyResponse.success && historyResponse.data?.history) {
        const sortedOrders = historyResponse.data.history;
        setCompletedOrders(sortedOrders);
        setStats(prev => ({
          ...prev,
          completedPickups: sortedOrders.length
        }));
      } else {
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('scrapperCompletedOrders') || '[]');
        const sortedOrders = orders.sort((a, b) => {
          const dateA = new Date(a.completedAt || a.pickedUpAt || 0);
          const dateB = new Date(b.completedAt || b.pickedUpAt || 0);
          return dateB - dateA;
        });
        setCompletedOrders(sortedOrders);
        setStats(prev => ({
          ...prev,
          completedPickups: orders.length
        }));
      }
    } catch (error) {
      console.error('Failed to load earnings history from backend:', error);
      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('scrapperCompletedOrders') || '[]');
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.pickedUpAt || 0);
        const dateB = new Date(b.completedAt || b.pickedUpAt || 0);
        return dateB - dateA;
      });
      setCompletedOrders(sortedOrders);
    }

    try {
      // Load active requests from backend
      const activeResponse = await scrapperOrdersAPI.getMyAssigned();
      if (activeResponse.success && activeResponse.data?.orders) {
        const active = activeResponse.data.orders.filter(o => {
          const s = o.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        });
        setActiveRequests(active);
        setStats(prev => ({
          ...prev,
          activeRequests: active.length
        }));
      } else {
        // Fallback to localStorage
        const requests = getScrapperAssignedRequests();
        const activeCount = requests.filter(req => {
          const s = req.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        }).length;
        setActiveRequests(requests.filter(req => {
          const s = req.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        }));
        setStats(prev => ({
          ...prev,
          activeRequests: activeCount
        }));
      }
    } catch (error) {
      console.error('Failed to load active requests from backend:', error);
      // Fallback to localStorage
      const requests = getScrapperAssignedRequests();
      const activeCount = requests.filter(req => {
        const s = req.status?.toLowerCase();
        return s !== 'completed' && s !== 'cancelled';
      }).length;
      setActiveRequests(requests.filter(req => {
        const s = req.status?.toLowerCase();
        return s !== 'completed' && s !== 'cancelled';
      }));
      setStats(prev => ({
        ...prev,
        activeRequests: activeCount
      }));
    }

    // Load separate market price subscription status (different from onboarding subscription)
    const marketStatus =
      localStorage.getItem('scrapperMarketPriceSubscriptionStatus') || 'inactive';
    setMarketSubStatus(marketStatus);

    try {
      // Load activity stats from backend
      const statsResponse = await scrapperProfileAPI.getStats();
      if (statsResponse.success && statsResponse.data?.stats) {
        setActivityStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error('Failed to load activity stats from backend:', error);
    }
  };

  // Handle availability toggle
  const handleAvailabilityToggle = async () => {
    const newAvailability = !isAvailable;

    // Check subscription if trying to go online
    if (newAvailability) {
      const isSubActive = subscriptionData?.isPlatformActive;
      if (!isSubActive) {
        // Show notification/alert and redirect
        alert(getTranslatedText('Active subscription required to go online. Please subscribe first.'));
        navigate('/scrapper/subscription?type=general');
        return;
      }
    }

    setIsAvailable(newAvailability);

    // Sync with backend
    try {
      await scrapperProfileAPI.updateMyProfile({ isOnline: newAvailability });
    } catch (error) {
      console.error('Failed to update availability status:', error);
      // Optional: revert state if failed, but for better UX we often just log it 
      // as the user might be offline and we want optimistic UI
    }

    // If turning ON, navigate to active requests page
    if (newAvailability) {
      navigate('/scrapper/active-requests', { replace: false });
    }
  };

  // Verify authentication and fetch KYC/Subscription status from backend
  useEffect(() => {
    const verifyAndFetchStatus = async () => {
      // Check if user is authenticated as scrapper locally
      const token = getAuthToken('scrapper');
      const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
      const scrapperUser = localStorage.getItem('scrapperUser');

      if (!token || scrapperAuth !== 'true' || !scrapperUser) {
        // ScrapperModule handles the redirect to login
        setIsLoadingStatus(false);
        return;
      }

      // Verify token/role with backend
      try {
        const { authAPI } = await import('../../shared/utils/api');
        const response = await authAPI.getMe();

        if (response.success && response.data?.user) {
          const userData = response.data.user;

          // Check if user has scrapper role
          if (userData.role !== 'scrapper') {
            console.warn('ScrapperDashboard: User does not have scrapper role:', userData.role);
            // Don't navigate here, ScrapperModule will handle the mismatch
            setIsLoadingStatus(false);
            return;
          }

          // Update scrapper-specific localStorage
          localStorage.setItem('scrapperAuthenticated', 'true');
          localStorage.setItem('scrapperUser', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('ScrapperDashboard: Auth verification failed:', error);
        // On error, we'll continue with KYC/Sub checks if we have local data, 
        // or let it fail naturally.
      }

      // Fetch KYC and Subscription status from backend
      setIsLoadingStatus(true);
      try {


        // Fetch KYC
        const kycRes = await kycAPI.getMy();
        const kyc = kycRes.data?.kyc;

        // Fetch Subscriptions
        const subRes = await subscriptionAPI.getMySubscription();
        const subscription = subRes.data?.subscription;
        const marketSubscription = subRes.data?.marketSubscription;

        if (kyc) {
          setKycStatus(kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYCStatus', kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
        } else {
          setKycStatus('not_submitted');
        }

        // Handle Subscriptions
        const platformSubActive = subscription?.status === 'active' && new Date(subscription.expiryDate) > new Date();
        const marketSubActive = marketSubscription?.status === 'active' && new Date(marketSubscription.expiryDate) > new Date();

        setSubscriptionData({
          platform: subscription,
          market: marketSubscription,
          isPlatformActive: platformSubActive,
          isMarketActive: marketSubActive
        });

        localStorage.setItem('scrapperSubscriptionStatus', platformSubActive ? 'active' : 'expired');
        // We might want to store market status too
        if (marketSubActive) {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'active');
        } else {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'inactive');
        }

        // Redirect based on REAL backend data
        const backendKycStatus = kyc?.status || 'not_submitted';

        /* KYC Hidden - Bypassing redirection
        // If KYC not submitted or rejected, redirect to KYC page
        if (!kyc || backendKycStatus === 'rejected' || backendKycStatus === 'not_submitted') {
          navigate('/scrapper/kyc', { replace: true });
          return;
        }

        // If KYC is pending, redirect to status page
        if (backendKycStatus === 'pending') {
          navigate('/scrapper/kyc-status', { replace: true });
          return;
        }
        */

        // If verified, proceed with dashboard loading
        // if (backendKycStatus === 'verified') {
           migrateOldActiveRequest();
           loadDashboardData();
        // }
      } catch (error) {
        console.error('Error fetching KYC/Subscription status:', error);
        // On error, check localStorage as fallback
        const fallbackKycStatus = localStorage.getItem('scrapperKYCStatus');
        if (!fallbackKycStatus || fallbackKycStatus === 'not_submitted') {
          navigate('/scrapper/kyc', { replace: true });
          return;
        }
        if (fallbackKycStatus === 'pending') {
          navigate('/scrapper/kyc-status', { replace: true });
          return;
        }

        // Reconstruct basic subscription data from localStorage
        const storedSubStatus = localStorage.getItem('scrapperSubscriptionStatus');
        const storedMarketStatus = localStorage.getItem('scrapperMarketPriceSubscriptionStatus');

        setSubscriptionData({
          isPlatformActive: storedSubStatus === 'active',
          isMarketActive: storedMarketStatus === 'active'
        });

        // If verified in localStorage, allow dashboard
        loadDashboardData();
      } finally {
        setIsLoadingStatus(false);
      }
    };

    // Call the verifier on mount
    verifyAndFetchStatus();
  }, [navigate]);

  // Poll for KYC/Subscription status updates (every 10 seconds)
  useEffect(() => {
    if (isLoadingStatus) return; // Don't poll while initial load

    const interval = setInterval(async () => {
      try {
        // Fetch KYC
        const kycRes = await kycAPI.getMy();
        const kyc = kycRes.data?.kyc;

        // Fetch Subscriptions
        const subRes = await subscriptionAPI.getMySubscription();
        const subscription = subRes.data?.subscription;
        const marketSubscription = subRes.data?.marketSubscription;

        if (kyc) {
          setKycStatus(kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYCStatus', kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
        }

        const platformSubActive = subscription?.status === 'active' && new Date(subscription.expiryDate) > new Date();
        const marketSubActive = marketSubscription?.status === 'active' && new Date(marketSubscription.expiryDate) > new Date();

        setSubscriptionData({
          platform: subscription,
          market: marketSubscription,
          isPlatformActive: platformSubActive,
          isMarketActive: marketSubActive
        });

        localStorage.setItem('scrapperSubscriptionStatus', platformSubActive ? 'active' : 'expired');
        if (marketSubActive) {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'active');
        } else {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'inactive');
        }

      } catch (error) {
        console.error('Error polling KYC/Subscription status:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [isLoadingStatus]);

  // Load data from localStorage on mount and when component updates
  useEffect(() => {
    if (!isLoadingStatus) {
      loadDashboardData();
    }
  }, [isLoadingStatus]);

  // Listen for storage changes and page visibility to update dashboard in real-time
  useEffect(() => {
    // Listen for storage events (when localStorage changes in other tabs/windows)
    window.addEventListener('storage', loadDashboardData);

    // Also check on focus (when user comes back to this tab)
    window.addEventListener('focus', loadDashboardData);

    // Check when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', loadDashboardData);
      window.removeEventListener('focus', loadDashboardData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Show loading state while fetching status from backend
  if (isLoadingStatus) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen w-full flex items-center justify-center bg-black"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-4 border-emerald-600"
          />
          <p className="text-sm font-semibold text-slate-800">
            {getTranslatedText("Loading dashboard...")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full text-slate-800"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <img src={siteLogo} alt="Scraptox" className="h-20 md:h-24 w-72 md:w-80 object-contain object-left -ml-4" />
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => navigate('/scrapper/profile')}
              className="focus:outline-none"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow bg-emerald-600"
              >
                <span className="text-white font-bold text-lg">
                  {(user?.name || 'S')[0].toUpperCase()}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Availability Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-xl shadow-md bg-white border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isAvailable ? 'animate-pulse bg-emerald-500' : 'bg-red-500'}`}
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isAvailable ? getTranslatedText('Available for Pickups') : getTranslatedText('Currently Offline')}
              </p>
              <p className="text-xs text-slate-500">
                {isAvailable ? getTranslatedText('You will receive requests') : getTranslatedText('Turn on to receive requests')}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAvailabilityToggle}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${isAvailable ? 'shadow-lg bg-emerald-600 text-white' : 'bg-emerald-500/20 text-emerald-600'}`}
          >
            {isAvailable ? getTranslatedText('ON') : getTranslatedText('OFF')}
          </motion.button>
        </motion.div>

        {/* Welcome Section */}
        <div className="mb-6 mt-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {getTranslatedText('Welcome, {name}! 👋', { name: user?.name?.split(' ')[0] || 'Scrapper' })}
          </h2>
        </div>

        {/* Your Activity Section */}
        <div className="mt-8 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{getTranslatedText('Your Activity')}</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Upcoming Pickups */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => navigate('/scrapper/my-active-requests')}
              className="bg-[#e8d5b7] p-3 rounded-3xl relative overflow-hidden h-32 shadow-sm cursor-pointer"
            >
              <h4 className="text-white text-sm font-bold leading-tight w-24">
                {getTranslatedText('Upcoming Pickups')}
              </h4>
              <div className="absolute bottom-3 left-3 bg-[#a67c52] w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white text-2xl font-black">{activityStats.upcomingPickups}</span>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 opacity-80 pointer-events-none translate-x-2 translate-y-2">
                 <FaCheck className="text-white/20 w-full h-full p-4" />
              </div>
            </motion.div>

            {/* Collectors */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => navigate('/scrapper/earnings')}
              className="bg-[#e8d5b7] p-3 rounded-3xl relative overflow-hidden h-32 shadow-sm cursor-pointer"
            >
              <h4 className="text-white text-sm font-bold leading-tight w-24">
                {getTranslatedText('Collectors')}
              </h4>
              <div className="absolute bottom-3 left-3 bg-[#a67c52] w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white text-2xl font-black">{activityStats.collectors}</span>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 opacity-80 pointer-events-none translate-x-2 translate-y-2">
                 <FaChartLine className="text-white/20 w-full h-full p-4" />
              </div>
            </motion.div>

            {/* Under Negotiation */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => navigate('/scrapper/marketplace?tab=my_bids')}
              className="bg-[#e8d5b7] p-3 rounded-3xl relative overflow-hidden h-32 shadow-sm cursor-pointer"
            >
              <h4 className="text-white text-sm font-bold leading-tight w-24">
                {getTranslatedText('Under Negotiation')}
              </h4>
              <div className="absolute bottom-3 left-3 bg-[#a67c52] w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white text-2xl font-black">{activityStats.underNegotiation}</span>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 opacity-80 pointer-events-none translate-x-2 translate-y-2">
                 <FaGift className="text-white/20 w-full h-full p-4" />
              </div>
            </motion.div>

            {/* Open Items */}
            <motion.div 
              whileHover={{ y: -2 }}
              onClick={() => navigate('/scrapper/marketplace')}
              className="bg-[#e8d5b7] p-3 rounded-3xl relative overflow-hidden h-32 shadow-sm cursor-pointer"
            >
              <h4 className="text-white text-sm font-bold leading-tight w-24">
                {getTranslatedText('Open Items')}
              </h4>
              <div className="absolute bottom-3 left-3 bg-[#a67c52] w-12 h-12 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white text-2xl font-black">{activityStats.openItems}</span>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 opacity-80 pointer-events-none translate-x-2 translate-y-2">
                 <FaGift className="text-white/20 w-full h-full p-4" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Platform Subscription Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          onClick={() => navigate('/scrapper/subscription?type=general')}
          className={`mt-4 rounded-2xl shadow-md p-4 md:p-5 border cursor-pointer relative overflow-hidden group transition-all duration-300 ${
            subscriptionData?.isPlatformActive 
            ? 'bg-white border-emerald-100 hover:border-emerald-200 shadow-sm' 
            : 'bg-red-50 border-red-100 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                subscriptionData?.isPlatformActive ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                <FaGift className={subscriptionData?.isPlatformActive ? 'text-emerald-600' : 'text-red-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5" 
                   style={{ color: subscriptionData?.isPlatformActive ? '#059669' : '#dc2626' }}>
                  {subscriptionData?.isPlatformActive 
                    ? getTranslatedText('Subscription Active') 
                    : subscriptionData?.platform?.planId 
                      ? getTranslatedText('Subscription Expired') 
                      : getTranslatedText('No Subscription')}
                </p>
                <h3 className="text-sm md:text-base font-bold text-slate-800">
                  {subscriptionData?.isPlatformActive 
                    ? getTranslatedText('Access to all pickup requests')
                    : subscriptionData?.platform?.planId
                      ? getTranslatedText('Renew to receive requests')
                      : getTranslatedText('Take subscription to receive requests')}
                </h3>
                {subscriptionData?.isPlatformActive && subscriptionData?.platform?.expiryDate && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {getTranslatedText('Valid until {date}', { date: new Date(subscriptionData.platform.expiryDate).toLocaleDateString() })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {!subscriptionData?.isPlatformActive && (
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  {subscriptionData?.platform?.planId ? getTranslatedText("Renew Now") : getTranslatedText("Subscribe Now")}
                </button>
              )}
              {subscriptionData?.isPlatformActive && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <FaCheck className="text-xs" />
                  <span className="text-xs font-bold">{getTranslatedText('Active')}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className={`absolute top-0 right-0 w-24 h-full opacity-10 pointer-events-none ${
            subscriptionData?.isPlatformActive ? 'bg-emerald-500' : 'bg-red-500'
          }`} 
          style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
        </motion.div>

        {/* Live Market Prices */}
        <div className="mt-4">
          {subscriptionData?.isMarketActive && (
            <div className="relative">
              <PriceTicker />
            </div>
          )}
        </div>

        {/* Ad Banners */}
        <div className="mt-4">
          <BannerSlider audience="scrapper" />
        </div>

        {/* Market Price Management Card */}
        {!subscriptionData?.isMarketActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/scrapper/subscription?type=market_price')}
            className="mt-3 rounded-2xl shadow-md p-4 md:p-5 border border-gray-800 cursor-pointer relative overflow-hidden group"
            style={{ backgroundColor: '#020617' }}
          >
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-1000 ease-in-out"></div>

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex gap-3">
                <div className="mt-1 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)' }}>
                  <FaChartLine className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#a5b4fc' }}>
                    {getTranslatedText("Market Price Add‑On")}
                  </p>
                  <h3 className="text-sm md:text-base font-bold mb-1" style={{ color: '#e5e7eb' }}>
                    {getTranslatedText("Unlock real‑time scrap rates")}
                  </h3>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  className="mt-1 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold border transition-colors"
                  style={{
                    borderColor: '#4b5563',
                    color: '#e5e7eb',
                    backgroundColor: 'transparent'
                  }}
                >
                  {getTranslatedText("View plans")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-24 md:p-6 space-y-4 md:space-y-6">
        {/* Earnings Summary */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-4 md:p-6 shadow-lg bg-white"
        >
          <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800">
            {getTranslatedText("Earnings Summary")}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs md:text-sm mb-1 text-slate-500">{getTranslatedText("Today")}</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600">
                ₹{earnings.today.toLocaleString()}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs md:text-sm mb-1 text-slate-500">{getTranslatedText("This Week")}</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600">
                ₹{earnings.week.toLocaleString()}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs md:text-sm mb-1 text-slate-500">{getTranslatedText("This Month")}</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600">
                ₹{earnings.month.toLocaleString()}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs md:text-sm mb-1 text-slate-500">{getTranslatedText("Total")}</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600">
                ₹{earnings.total.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div> */}

        {/* Bottom Navigation for Mobile */}
        <div className="md:hidden">
          <ScrapperBottomNav />
        </div>
      </div>
    </motion.div>
  );
};

export default ScrapperDashboard;

