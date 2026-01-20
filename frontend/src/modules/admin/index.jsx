import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../shared/context/AdminAuthContext';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/Dashboard';
import KYCQueue from './components/KYCQueue';
import UsersList from './components/UsersList';
import UserDetail from './components/UserDetail';
import ScrappersList from './components/ScrappersList';
import ScrapperLeads from './components/ScrapperLeads';
import ScrapperDetail from './components/ScrapperDetail';
import PriceFeedEditor from './components/PriceFeedEditor';
import ActiveRequests from './components/ActiveRequests';
import CompletedOrders from './components/CompletedOrders';
import SubscriptionsList from './components/SubscriptionsList';
import SubscriptionPlanManagement from './components/SubscriptionPlanManagement';
import Reports from './components/Reports';
import Earnings from './components/Earnings';
import AdminProfile from './components/AdminProfile';
import ReferralsList from './components/ReferralsList';
import ReferralSettings from './components/ReferralSettings';
import MilestoneRewards from './components/MilestoneRewards';
import TierManagement from './components/TierManagement';
import LeaderboardManagement from './components/LeaderboardManagement';
import FraudDetection from './components/FraudDetection';
import ReferralAnalytics from './components/ReferralAnalytics';
import CampaignManagement from './components/CampaignManagement';
import HelpSupport from './components/HelpSupport';
import BannerManagement from './components/BannerManagement';
import { usePageTranslation } from '../../hooks/usePageTranslation';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Admin Module Routes
const AdminModuleRoutes = () => {
  const { isAuthenticated } = useAdminAuth();
  const { getTranslatedText } = usePageTranslation(["App Settings - Coming Soon"]);

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show protected routes
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        {/* KYC Management */}
        <Route path="kyc" element={<KYCQueue />} />
        {/* User Management */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/:userId" element={<UserDetail />} />
        {/* Scrapper Management */}
        <Route path="scrappers" element={<ScrappersList />} />
        <Route path="scrappers/leads" element={<ScrapperLeads />} />
        <Route path="scrappers/:scrapperId" element={<ScrapperDetail />} />
        {/* Price Feed Management */}
        <Route path="prices" element={<PriceFeedEditor />} />
        {/* Request Management */}
        <Route path="requests" element={<ActiveRequests />} />
        <Route path="orders" element={<CompletedOrders />} />
        {/* Subscription Management */}
        <Route path="subscriptions" element={<SubscriptionsList />} />
        <Route path="subscriptions/plans" element={<SubscriptionPlanManagement />} />
        {/* Referral Management */}
        <Route path="referrals" element={<ReferralsList />} />
        <Route path="referrals/settings" element={<ReferralSettings />} />
        <Route path="referrals/milestones" element={<MilestoneRewards />} />
        <Route path="referrals/tiers" element={<TierManagement />} />
        <Route path="referrals/leaderboard" element={<LeaderboardManagement />} />
        <Route path="referrals/fraud" element={<FraudDetection />} />
        <Route path="referrals/analytics" element={<ReferralAnalytics />} />
        <Route path="referrals/campaigns" element={<CampaignManagement />} />
        {/* Reports & Analytics */}
        <Route path="reports" element={<Reports />} />
        <Route path="earnings" element={<Earnings />} />
        {/* Banner Management */}
        <Route path="banners" element={<BannerManagement />} />
        {/* Help & Support */}
        <Route path="support" element={<HelpSupport />} />
        {/* Profile */}
        <Route path="profile" element={<AdminProfile />} />
        {/* Placeholder routes for future pages */}
        <Route path="settings" element={<div className="p-6 text-center">{getTranslatedText("App Settings - Coming Soon")}</div>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

const AdminModule = () => {
  return (
    <AdminAuthProvider>
      <AdminModuleRoutes />
    </AdminAuthProvider>
  );
};

export default AdminModule;
