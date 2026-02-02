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
import { authAPI } from '../shared/utils/api';
import { FaHome, FaList, FaRegComments, FaUser, FaWallet } from 'react-icons/fa';
import WebViewHeader from '../shared/components/WebViewHeader';

// Helper function to check KYC status
const getKYCStatus = () => {
  const kycStatus = localStorage.getItem('scrapperKYCStatus');
  const kycData = localStorage.getItem('scrapperKYC');

  if (!kycData) return 'not_submitted';
  if (kycStatus === 'verified') return 'verified';
  if (kycStatus === 'pending') return 'pending';
  if (kycStatus === 'rejected') return 'rejected';
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

  // Verify authentication - re-check when isAuthenticated or user changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const verifyScrapperAuth = async () => {
      const token = localStorage.getItem('token');
      const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
      const scrapperUser = localStorage.getItem('scrapperUser');

      // If no token or scrapper flags, not authenticated
      if (!token || scrapperAuth !== 'true' || !scrapperUser) {
        if (isMounted) {
          setScrapperIsAuthenticated(false);
          setIsVerifying(false);
        }
        return;
      }

      // If we already have authenticated user from context and it's a scrapper, use it
      if (isAuthenticated && user && user.role === 'scrapper') {
        if (isMounted) {
          setScrapperIsAuthenticated(true);
          setIsVerifying(false);
        }
        return;
      }

      setIsVerifying(true);

      try {
        // Verify token with backend
        const response = await authAPI.getMe();

        if (!isMounted) return;

        if (response.success && response.data?.user) {
          const userData = response.data.user;

          // Check if user has scrapper role
          if (userData.role === 'scrapper') {
            // Update auth context if needed
            if (!isAuthenticated || !user) {
              login(userData, token);
            }

            // Update scrapper-specific localStorage
            localStorage.setItem('scrapperAuthenticated', 'true');
            localStorage.setItem('scrapperUser', JSON.stringify(userData));

            // Check if scrapper is blocked
            const scrapperStatus = localStorage.getItem('scrapperStatus') || 'active';
            if (scrapperStatus === 'blocked') {
              setScrapperIsAuthenticated(false);
              logout();
              localStorage.removeItem('scrapperAuthenticated');
              localStorage.removeItem('scrapperUser');
            } else {
              setScrapperIsAuthenticated(true);
            }
          } else {
            // User doesn't have scrapper role
            console.warn('User does not have scrapper role:', userData.role);
            setScrapperIsAuthenticated(false);
            logout();
            localStorage.removeItem('scrapperAuthenticated');
            localStorage.removeItem('scrapperUser');
          }
        } else {
          // Token invalid
          setScrapperIsAuthenticated(false);
          logout();
          localStorage.removeItem('scrapperAuthenticated');
          localStorage.removeItem('scrapperUser');
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('Auth verification failed:', error);
        // On 401, clear everything
        if (error.status === 401) {
          setScrapperIsAuthenticated(false);
          logout();
          localStorage.removeItem('scrapperAuthenticated');
          localStorage.removeItem('scrapperUser');
        } else {
          // For other errors, check localStorage as fallback
          const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
          const scrapperUser = localStorage.getItem('scrapperUser');
          const scrapperStatus = localStorage.getItem('scrapperStatus') || 'active';
          setScrapperIsAuthenticated(
            scrapperAuth === 'true' &&
            scrapperUser !== null &&
            scrapperStatus !== 'blocked'
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    // Add a small delay to allow login to complete
    timeoutId = setTimeout(() => {
      verifyScrapperAuth();
    }, 100);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, login, logout]); // Re-check when auth state changes

  const kycStatus = scrapperIsAuthenticated ? getKYCStatus() : 'not_submitted';
  const subscriptionStatus = scrapperIsAuthenticated && kycStatus === 'verified' ? getSubscriptionStatus() : 'not_subscribed';

  // Show loading while verifying (but allow navigation if we have token and user)
  const hasToken = !!localStorage.getItem('token');
  const hasScrapperAuth = localStorage.getItem('scrapperAuthenticated') === 'true';

  if (isVerifying && !hasToken && !hasScrapperAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated as scrapper, show login / public routes
  // But check if we're in the process of logging in (has token but not yet verified)
  if (!scrapperIsAuthenticated && (!hasToken || !hasScrapperAuth)) {
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

        {/* Redirect logic based on KYC and Subscription status */}
        <Route path="*" element={
          kycStatus === 'not_submitted' ? (
            <Navigate to="/scrapper/kyc" replace />
          ) : kycStatus === 'rejected' ? (
            <Navigate to="/scrapper/kyc" replace />
          ) : kycStatus === 'pending' ? (
            <Navigate to="/scrapper/kyc-status" replace />
          ) : kycStatus === 'verified' && subscriptionStatus !== 'active' ? (
            <Navigate to="/scrapper/subscription" replace />
          ) : kycStatus === 'verified' && subscriptionStatus === 'active' ? (
            <Navigate to="/scrapper" replace />
          ) : (
            <Navigate to="/scrapper/kyc" replace />
          )
        } />
      </Routes>
    </div>
  );
};

export default ScrapperModule;

