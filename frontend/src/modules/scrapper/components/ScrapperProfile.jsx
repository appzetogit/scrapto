import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { kycAPI, subscriptionAPI, reviewAPI, scrapperProfileAPI } from '../../shared/utils/api';
import RatingDisplay from '../../shared/components/RatingDisplay';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import EditProfileModal from './EditProfileModal';
import ScrapperBottomNav from './ScrapperBottomNav';

const ScrapperProfile = () => {
  const staticTexts = [
    "Loading profile...",
    "Scrapper Profile",
    "Close",
    "Scrapper",
    "Phone not set",
    "Logout",
    "Verified",
    "Pending",
    "Rejected",
    "Not Submitted",
    "No subscription",
    "{planName} active",
    "Vehicle not set",
    "Profile details",
    "Edit profile",
    "Name",
    "Phone",
    "Vehicle",
    "Not provided",
    "Heard about Scrapto",
    "Profile editing will be available soon.",
    "KYC status",
    "View",
    "Subscription",
    "{planName} • ₹{price}/month",
    "No active subscription",
    "Manage",
    "Active requests",
    "View and manage current pickups",
    "Earnings & history",
    "Check completed pickups and payouts",
    "Refer & Earn",
    "Share your code and earn extra on pickups",
    "Terms & Conditions",
    "Read how Scrapto works for scrappers",
    "Terms & Conditions screen will be added later.",
    "Help & Support",
    "Get help for any issue"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrapperUser, setScrapperUser] = useState(user);
  const [rating, setRating] = useState({ average: 0, count: 0, breakdown: null });
  const [showKycInfo, setShowKycInfo] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleProfileUpdate = (updatedScrapper) => {
    // 1. Update local state
    setScrapperUser(prev => ({
      ...prev,
      ...updatedScrapper
    }));

    // 2. Update LocalStorage (so Navbar/Header updates immediately on refresh/reload)
    // Merge with existing user data in storage to avoid losing irrelevant keys
    try {
      const storedUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
      const newStoredUser = { ...storedUser, ...updatedScrapper };
      localStorage.setItem('scrapperUser', JSON.stringify(newStoredUser));
    } catch (e) {
      console.error("Local storage update error", e);
    }

    // 3. Close Modal
    setIsEditModalOpen(false);
  };

  useEffect(() => {
    const fetchScrapperData = async () => {
      try {
        setLoading(true);

        // Verify authentication
        if (!user || user.role !== 'scrapper') {
          navigate('/scrapper/login', { replace: true });
          return;
        }

        setScrapperUser(user);

        // Fetch KYC status from API
        try {
          const kycResponse = await kycAPI.getMy();
          if (kycResponse.success && kycResponse.data?.kyc) {
            setKycStatus(kycResponse.data.kyc.status || 'not_submitted');
          }
        } catch (kycError) {
          console.error('Error fetching KYC:', kycError);
          setKycStatus('not_submitted');
        }

        // Fetch subscription status from API
        try {
          const subResponse = await subscriptionAPI.getMySubscription();
          if (subResponse.success && subResponse.data?.subscription) {
            const sub = subResponse.data.subscription;
            setSubscription({
              status: sub.status,
              planId: sub.planId?._id || sub.planId,
              planName: sub.planId?.name || 'Unknown Plan',
              price: sub.planId?.price || 0,
              startDate: sub.startDate,
              expiryDate: sub.expiryDate,
              autoRenew: sub.autoRenew
            });
          }
        } catch (subError) {
          console.error('Error fetching subscription:', subError);
          setSubscription(null);
        }

        // Fetch detailed Scrapper Profile (including ratings)
        try {
          const profileResponse = await scrapperProfileAPI.getMyProfile();
          if (profileResponse.success && profileResponse.data?.scrapper) {
            const scrapperData = profileResponse.data.scrapper;

            // Update scrapper user with more details if needed
            setScrapperUser(prev => ({ ...prev, ...scrapperData }));

            // Set Rating
            if (scrapperData.rating) {
              setRating({
                average: parseFloat(scrapperData.rating.average || 0),
                count: scrapperData.rating.count || 0,
                breakdown: scrapperData.rating.breakdown || null
              });
            }
          }
        } catch (profileError) {
          console.error('Error fetching scrapper profile:', profileError);
        }
      } catch (error) {
        console.error('Error fetching scrapper data:', error);
        navigate('/scrapper/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchScrapperData();
  }, [user, navigate]);

  const handleLogout = () => {
    // Clear scrapper flags plus global auth
    localStorage.removeItem('scrapperAuthenticated');
    localStorage.removeItem('scrapperUser');
    logout();
    navigate('/scrapper/login', { replace: true });
  };

  const getKycLabel = () => {
    switch (kycStatus) {
      case 'verified':
        return { label: getTranslatedText('Verified'), className: 'bg-emerald-100 text-emerald-700' };
      case 'pending':
        return { label: getTranslatedText('Pending'), className: 'bg-orange-100 text-orange-700' };
      case 'rejected':
        return { label: getTranslatedText('Rejected'), className: 'bg-red-100 text-red-700' };
      default:
        return { label: getTranslatedText('Not Submitted'), className: 'bg-slate-100 text-slate-500' };
    }
  };

  const kycConfig = getKycLabel();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dcfce7]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4 animate-spin" />
          <p className="text-emerald-800 font-medium">{getTranslatedText("Loading profile...")}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 md:pb-0"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}
    >
      {/* Sticky header similar to user profile */}
      <div className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6 bg-white/20 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1
            className="text-xl md:text-2xl font-bold text-white"
          >
            {getTranslatedText("Scrapper Profile")}
          </h1>

        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile header card – align with user profile style */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 md:mb-6"
        >
          <div
            className="rounded-2xl p-4 md:p-6 shadow-lg backdrop-blur-sm bg-white/95"
          >
            <div className="flex items-center gap-3 md:gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 relative bg-emerald-50 border-4 border-emerald-100"
              >
                <span
                  className="text-2xl md:text-3xl font-bold text-emerald-600"
                >
                  {(scrapperUser?.name || 'S')[0].toUpperCase()}
                </span>
              </div>

              {/* Scrapper basic info + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <h2
                      className="text-lg md:text-xl font-bold text-slate-800"
                    >
                      {scrapperUser?.name || getTranslatedText('Scrapper')}
                    </h2>
                    <p
                      className="text-sm md:text-base text-slate-500"
                    >
                      {scrapperUser?.phone || getTranslatedText('Phone not set')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[11px] md:text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    {getTranslatedText("Logout")}
                  </button>
                </div>

                {/* Rating Display */}
                {rating.count > 0 && (
                  <div className="mt-2 mb-2">
                    <RatingDisplay
                      averageRating={rating.average}
                      totalReviews={rating.count}
                      breakdown={rating.breakdown}
                      showBreakdown={false}
                      size="sm"
                    />
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {/* KYC badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${kycConfig.className}`}
                  >
                    {getTranslatedText("KYC:")} {kycConfig.label}
                  </span>
                  {/* Subscription badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${subscription ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {subscription ? getTranslatedText("{planName} active", { planName: subscription.planName }) : getTranslatedText('No subscription')}
                  </span>
                  {/* Vehicle info small badge */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize"
                  >
                    {scrapperUser?.vehicleInfo
                      ? `${scrapperUser.vehicleInfo.type} • ${scrapperUser.vehicleInfo.number}`
                      : getTranslatedText('Vehicle not set')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details + navigation list – follow user profile feel */}
        <div className="space-y-4 md:space-y-5 pb-4 md:pb-8">
          {/* Compact details card */}
          <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm p-3 md:p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-sm font-semibold text-slate-700">
                {getTranslatedText("Profile details")}
              </p>
              <button
                type="button"
                className="text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                onClick={() => setIsEditModalOpen(true)}
              >
                {getTranslatedText("Edit profile")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] md:text-xs text-slate-600">
              <span>{getTranslatedText("Name")}</span>
              <span className="font-semibold text-right text-slate-900">
                {scrapperUser?.name || '-'}
              </span>
              <span>{getTranslatedText("Phone")}</span>
              <span className="font-semibold text-right text-slate-900">
                {scrapperUser?.phone || '-'}
              </span>
              <span>{getTranslatedText("Vehicle")}</span>
              <span className="font-semibold text-right text-slate-900">
                {scrapperUser?.vehicleInfo
                  ? <span className="capitalize">{scrapperUser.vehicleInfo.type} • {scrapperUser.vehicleInfo.number}</span>
                  : getTranslatedText('Not provided')}
              </span>
              {scrapperUser?.heardFrom && (
                <>
                  <span>{getTranslatedText("Heard about Scrapto")}</span>
                  <span className="font-semibold text-right text-slate-900">
                    {scrapperUser.heardFrom.startsWith('other:')
                      ? scrapperUser.heardFrom.replace('other:', '')
                      : scrapperUser.heardFrom}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* All actions / links in one list */}
          <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm divide-y divide-slate-100 shadow-sm">
            {/* KYC status */}
            <div className="flex flex-col border-b border-slate-100 last:border-0">
              <button
                type="button"
                onClick={() => {
                  if (kycStatus === 'not_submitted') {
                    navigate('/scrapper/kyc');
                  } else {
                    setShowKycInfo(!showKycInfo);
                  }
                }}
                className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors bg-white rounded-t-2xl"
              >
                <div>
                  <p className="text-xs md:text-sm font-semibold text-slate-800">
                    {getTranslatedText("KYC status")}
                  </p>
                  <p className="text-[11px] md:text-xs text-slate-500">
                    {kycConfig.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${kycConfig.className}`}
                  >
                    {getTranslatedText("View")}
                  </span>
                </div>
              </button>

              {/* Inline KYC Details Card */}
              {showKycInfo && kycStatus !== 'not_submitted' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 bg-slate-50/50 overflow-hidden"
                >
                  <div className="p-3 mt-1 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{getTranslatedText("Status")}</span>
                      <span className={`font-bold ${kycConfig.className.replace('bg-', 'text-').split(' ')[1]}`}>
                        {kycConfig.label}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                        {getTranslatedText("Submitted Documents")}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {getTranslatedText("Aadhaar Card")}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {getTranslatedText("PAN Card")}
                        </div>
                      </div>
                    </div>

                    {kycStatus === 'rejected' && (
                      <button
                        onClick={() => navigate('/scrapper/kyc')}
                        className="w-full mt-2 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        {getTranslatedText("Resubmit KYC")}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Subscription */}
            <button
              type="button"
              onClick={() => navigate('/scrapper/subscription')}
              className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-800">
                  {getTranslatedText("Subscription")}
                </p>
                <p className="text-[11px] md:text-xs text-slate-500">
                  {subscription
                    ? getTranslatedText("{planName} • ₹{price}/month", { planName: subscription.planName, price: subscription.price })
                    : getTranslatedText('No active subscription')}
                </p>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700"
              >
                {getTranslatedText("Manage")}
              </span>
            </button>

            {/* Requests & history */}
            <button
              type="button"
              onClick={() => navigate('/scrapper/my-active-requests')}
              className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-800">
                  {getTranslatedText("Active requests")}
                </p>
                <p className="text-[11px] md:text-xs text-slate-500">
                  {getTranslatedText("View and manage current pickups")}
                </p>
              </div>
              <span className="text-sm text-slate-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/earnings')}
              className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-800">
                  {getTranslatedText("Earnings & history")}
                </p>
                <p className="text-[11px] md:text-xs text-slate-500">
                  {getTranslatedText("Check completed pickups and payouts")}
                </p>
              </div>
              <span className="text-sm text-slate-400">
                ›
              </span>
            </button>

            {/* Refer & legal */}
            <button
              type="button"
              onClick={() => navigate('/scrapper/refer')}
              className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-800">
                  {getTranslatedText("Refer & Earn")}
                </p>
                <p className="text-[11px] md:text-xs text-slate-500">
                  {getTranslatedText("Share your code and earn extra on pickups")}
                </p>
              </div>
              <span className="text-sm text-slate-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/terms')}
              className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-800">
                  {getTranslatedText("Terms & Conditions")}
                </p>
                <p className="text-[11px] md:text-xs text-slate-500">
                  {getTranslatedText("Read how Scrapto works for scrappers")}
                </p>
              </div>
              <span className="text-sm text-slate-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/help')}
              className="w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-3.5 text-left hover:bg-slate-50 transition-colors rounded-b-2xl"
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-800">
                  {getTranslatedText("Help & Support")}
                </p>
                <p className="text-[11px] md:text-xs text-slate-500">
                  {getTranslatedText("Get help for any issue")}
                </p>
              </div>
              <span className="text-sm text-slate-400">
                ›
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={scrapperUser}
        onSuccess={handleProfileUpdate}
      />

      <div className="md:hidden">
        <ScrapperBottomNav />
      </div>
    </motion.div>
  );
};

export default ScrapperProfile;


