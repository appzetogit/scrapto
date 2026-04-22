import { useAuth } from '../shared/context/AuthContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ScrapperLogin from './components/ScrapperLogin';
import ScrapperDashboard from './components/ScrapperDashboard';
import KYCUploadPage from './components/KYCUploadPage';
import KYCStatusPage from './components/KYCStatusPage';
import SubscriptionPlanPage from './components/SubscriptionPlanPage';
import ActiveRequestsPage from './components/ActiveRequestsPage';
import ActiveRequestDetailsPage from './components/ActiveRequestDetailsPage';
import MyActiveRequestsPage from './components/MyActiveRequestsPage';
import ReferAndEarn from './components/ReferAndEarn';
import ScrapperHelpSupport from './components/ScrapperHelpSupport';
import ScrapperProfile from './components/ScrapperProfile';
import ScrapperTerms from './components/ScrapperTerms';
import ChatPage from './components/ChatPage';
import ChatListPage from './components/ChatListPage';
import ScrapperWallet from './components/ScrapperWallet';
import ScrapperEarningsPage from './components/ScrapperEarningsPage';
import { authAPI, getAuthToken } from '../shared/utils/api';
import { FaHome, FaList, FaRegComments, FaUser, FaWallet } from 'react-icons/fa';
import WebViewHeader from '../shared/components/WebViewHeader';

// Helper function to check KYC status
const getKYCStatus = () => {
  const kycStatus = localStorage.getItem('scrapperKYCStatus');
  const kycData = localStorage.getItem('scrapperKYC');

  if (!kycData) return 'not_submitted';
  
  try {
    const kyc = JSON.parse(kycData);
    // Explicitly verify if Aadhaar photo was uploaded. 
    // This prevents empty 'pending' objects from backend from bypassing the upload page.
    if (kycStatus === 'pending' && !kyc?.aadhaarPhotoUrl) {
      return 'not_submitted';
    }
  } catch (e) {
    return 'not_submitted';
  }

  if (kycStatus === 'verified') return 'verified';
  if (kycStatus === 'pending') return 'pending';
  if (kycStatus === 'rejected') return 'rejected';
  if (kycStatus === 'not_submitted') return 'not_submitted';
  return 'not_submitted';
};

// Helper function to check subscription status
const getSubscriptionStatus = () => {
  const subscriptionStatus = localStorage.getItem('scrapperSubscriptionStatus');
  const subscriptionData = localStorage.getItem('scrapperSubscription');

  if (!subscriptionData || !subscriptionStatus) return 'not_subscribed';
  if (subscriptionStatus === 'active') {
    const sub = JSON.parse(subscriptionData);
    const expiryDate = new Date(sub.expiryDate);
    const now = new Date();
    if (expiryDate > now) {
      return 'active';
    } else {
      return 'expired';
    }
  }
  return 'not_subscribed';
};

const ScrapperModule = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [scrapperIsAuthenticated, setScrapperIsAuthenticated] = useState(false);

  // Verify authentication - re-check when global isAuthenticated or user changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const verifyScrapperAuth = async () => {
      const token = getAuthToken('scrapper');
      const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
      const scrapperUser = localStorage.getItem('scrapperUser');

      // 1. If no token OR no scrapper-specific login flags, they are not logged in as a scrapper
      if (!token || scrapperAuth !== 'true' || !scrapperUser) {
        if (isMounted) {
          setScrapperIsAuthenticated(false);
          setIsVerifying(false);
        }
        return;
      }

      // 2. If we already have a scrapper user in global context, we're good
      if (isAuthenticated && user && user.role === 'scrapper') {
        if (isMounted) {
          setScrapperIsAuthenticated(true);
          setIsVerifying(false);
        }
        return;
      }

      // 3. Otherwise, we have scrapper flags but global context might be missing or wrong.
      // We need to verify the token with the backend.
      try {
        const response = await authAPI.getMe();
        if (!isMounted) return;

        if (response.success && response.data?.user) {
          const userData = response.data.user;

          if (userData.role === 'scrapper') {
            // Update global context if it's missing or role is different
            if (!isAuthenticated || !user || user.role !== 'scrapper') {
              login(userData, token);
            }
            setScrapperIsAuthenticated(true);
          } else {
            // User exists but is NOT a scrapper - Clear scrapper session
            console.warn('User does not have scrapper role:', userData.role);
            setScrapperIsAuthenticated(false);
            localStorage.removeItem('scrapperAuthenticated');
            localStorage.removeItem('scrapperUser');
            localStorage.removeItem('scrapperToken');
          }
        } else {
          // Token invalid
          setScrapperIsAuthenticated(false);
          localStorage.removeItem('scrapperAuthenticated');
          localStorage.removeItem('scrapperUser');
          localStorage.removeItem('scrapperToken');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Auth verification failed:', error);
        
        // On explicit auth error or role mismatch, clear session
        setScrapperIsAuthenticated(false);
        localStorage.removeItem('scrapperAuthenticated');
        localStorage.removeItem('scrapperToken');
        localStorage.removeItem('scrapperUser');
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    // Run verification
    verifyScrapperAuth();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user]); 

  // Show loading while verifying (but allow navigation if we have token and user)
  const hasToken = !!getAuthToken('scrapper');
  const hasScrapperAuth = localStorage.getItem('scrapperAuthenticated') === 'true';
  const hasScrapperSession = hasScrapperAuth && (hasToken || !!localStorage.getItem('scrapperUser'));

  // A "soft" authenticated check that allows for context initialization delay
  const isTransitioning = !scrapperIsAuthenticated && hasScrapperSession;

  const kycStatus = 'verified'; // KYC hidden - always verified
  // const kycStatus = scrapperIsAuthenticated ? getKYCStatus() : 'not_submitted';
  const subscriptionStatus = scrapperIsAuthenticated && kycStatus === 'verified' ? getSubscriptionStatus() : 'not_subscribed';

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dcfce7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-emerald-800 font-medium">Verifying scrapper session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated as scrapper, show login / public routes
  if (!scrapperIsAuthenticated) {
    return (
      <Routes>
        {/* Public routes (no scrapper auth required) */}
        <Route path="/login" element={<ScrapperLogin />} />
        <Route path="/kyc" element={<KYCUploadPage />} />
        <Route path="/terms" element={<ScrapperTerms />} />

        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/scrapper/login" replace />} />
        {/* Catch all other routes and redirect to login */}
        <Route path="*" element={<Navigate to="/scrapper/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, check KYC status and route accordingly
  // Always register all routes, but use Navigate for redirects

  const navItems = [
    { label: 'Dashboard', path: '/scrapper/dashboard', icon: FaHome },
    { label: 'Active Requests', path: '/scrapper/active-requests', icon: FaList },
    { label: 'Chats', path: '/scrapper/chats', icon: FaRegComments },
    { label: 'Wallet', path: '/scrapper/wallet', icon: FaWallet }, // Added Wallet Option
    { label: 'Profile', path: '/scrapper/profile', icon: FaUser },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <WebViewHeader navItems={navItems} userRole="scrapper" />
      <Routes>
        {/* KYC Upload Route */}
        <Route path="/kyc" element={<KYCUploadPage />} />

        {/* KYC Status Route */}
        <Route path="/kyc-status" element={<KYCStatusPage />} />

        {/* Subscription Plan Route */}
        <Route path="/subscription" element={<SubscriptionPlanPage />} />

        {/* Dashboard Route */}
        <Route path="/" element={<ScrapperDashboard />} />
        <Route path="/dashboard" element={<ScrapperDashboard />} />

        {/* Active Requests Route - for when scrapper is online */}
        <Route path="/active-requests" element={<ActiveRequestsPage />} />

        {/* My Active Requests List Route - shows all active requests */}
        <Route path="/my-active-requests" element={<MyActiveRequestsPage />} />

        {/* Active Request Details Route - after accepting a request */}
        <Route path="/active-request/:requestId" element={<ActiveRequestDetailsPage />} />

        {/* Help & Support */}
        <Route path="/help" element={<ScrapperHelpSupport />} />

        {/* Profile */}
        <Route path="/profile" element={<ScrapperProfile />} />
        <Route path="/terms" element={<ScrapperTerms />} />

        {/* Refer & Earn Route */}
        <Route path="/refer" element={<ReferAndEarn />} />

        {/* Chat Routes */}
        <Route path="/chats" element={<ChatListPage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />

        {/* Wallet Route */}
        <Route path="/wallet" element={<ScrapperWallet />} />

        {/* Earnings Route */}
        <Route path="/earnings" element={<ScrapperEarningsPage />} />

        {/* 
            Strict catch-all: 
            If we are here, we are verified as scrapper. 
            Redirect anything else to dashboard.
        */}
        <Route path="*" element={<Navigate to="/scrapper/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default ScrapperModule;

