import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { checkAndProcessMilestone } from '../../shared/utils/referralUtils';
import { kycAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const KYCStatusPage = () => {
  const staticTexts = [
    "Pending Verification",
    "Your KYC is under review",
    "Our admin team is verifying your documents. This usually takes 24-48 hours.",
    "verified",
    "Verified",
    "Your KYC has been verified",
    "You can now start receiving pickup requests.",
    "Completed",
    "rejected",
    "Rejected",
    "Your KYC was rejected",
    "Please resubmit your KYC documents with correct information.",
    "Resubmit required",
    "Not Submitted",
    "KYC not submitted",
    "Please complete your KYC to continue.",
    "Not started",
    "KYC Status",
    "Track your KYC verification status",
    "Testing Mode: Auto-verification in {countdown} seconds",
    "Estimated Completion Time:",
    "Submitted Details",
    "Aadhaar Number:",
    "Submitted On:",
    "Status:",
    "Resubmit KYC",
    "Continue to Subscription",
    "Waiting for Verification",
    "Your KYC is under review. You'll be automatically redirected to dashboard once verified.",
    "What happens next?",
    "Our admin team will verify your documents",
    "Verification typically takes 24-48 hours",
    "You'll receive a notification once verification is complete",
    "Once verified, you can start receiving pickup requests"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [kycStatus, setKycStatus] = useState('pending');

  useEffect(() => {

    let interval;
    const fetchKyc = async () => {
      try {
        const res = await kycAPI.getMy();
        const kyc = res.data?.kyc;
        const subscription = res.data?.subscription;

        if (kyc) {
          setKycData(kyc);
          setKycStatus(kyc.status || 'pending');

          // Sync to local storage just in case other components need it partially
          localStorage.setItem('scrapperKYCStatus', kyc.status || 'pending');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));

          if (kyc.status === 'verified') {
            try {
              const scrUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
              if (scrUser.phone || scrUser.id) {
                checkAndProcessMilestone(scrUser.phone || scrUser.id, 'scrapper', 'kycVerified');
              }
            } catch (err) {
              console.error('Milestone error:', err);
            }

            // Check subscription status relative to backend data
            let isActive = false;
            if (subscription && subscription.status === 'active' && subscription.expiryDate) {
              const expiry = new Date(subscription.expiryDate);
              if (expiry > new Date()) {
                isActive = true;
              }
            }

            setTimeout(() => {
              if (isActive) {
                navigate('/scrapper', { replace: true });
              } else {
                navigate('/scrapper/subscription', { replace: true });
              }
            }, 1000);
          } else if (kyc.status === 'rejected') {
            // Stay here, user sees rejected status and button to resubmit
          }
        } else {
          // No KYC found -> Redirect to upload page
          navigate('/scrapper/kyc', { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch KYC status', error);
      }
    };

    fetchKyc();
    interval = setInterval(fetchKyc, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const getStatusConfig = () => {
    switch (kycStatus) {
      case 'pending':
        return {
          label: getTranslatedText('Pending Verification'),
          color: '#f59e0b',
          icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.2" />
              <path d="M12 6v6l4 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          message: getTranslatedText('Your KYC is under review'),
          description: getTranslatedText('Our admin team is verifying your documents. This usually takes 24-48 hours.'),
          estimatedTime: '24-48 hours'
        };
      case 'verified':
        return {
          label: getTranslatedText('Verified'),
          color: '#10b981',
          icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" fill="#10b981" fillOpacity="0.1" />
              <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          message: getTranslatedText('Your KYC has been verified'),
          description: getTranslatedText('You can now start receiving pickup requests.'),
          estimatedTime: getTranslatedText('Completed')
        };
      case 'rejected':
        return {
          label: getTranslatedText('Rejected'),
          color: '#ef4444',
          icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" fill="#ef4444" fillOpacity="0.1" />
              <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ),
          message: getTranslatedText('Your KYC was rejected'),
          description: getTranslatedText('Please resubmit your KYC documents with correct information.'),
          estimatedTime: getTranslatedText('Resubmit required')
        };
      default:
        return {
          label: getTranslatedText('Not Submitted'),
          color: '#718096',
          icon: null,
          message: getTranslatedText('KYC not submitted'),
          description: getTranslatedText('Please complete your KYC to continue.'),
          estimatedTime: getTranslatedText('Not started')
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full p-4 md:p-6 bg-gradient-to-br from-zinc-900 via-gray-900 to-black"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/scrapper')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors flex-shrink-0 bg-zinc-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {getTranslatedText("KYC Status")}
              </h1>
            </div>
          </div>
          <p className="text-sm md:text-base ml-14 text-gray-400">
            {getTranslatedText("Track your KYC verification status")}
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 md:p-8 shadow-xl mb-6 bg-zinc-900 border border-white/10"
        >
          {/* Status Icon & Label */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${statusConfig.color}20` }}
            >
              {statusConfig.icon}
            </div>
            <div className="flex-1">
              <h2
                className="text-xl md:text-2xl font-bold mb-1"
                style={{ color: statusConfig.color }}
              >
                {statusConfig.label}
              </h2>
              <p className="text-sm md:text-base text-gray-400">
                {statusConfig.message}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-sm md:text-base mb-4 text-gray-300">
              {statusConfig.description}
            </p>


            {/* Estimated Time */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#64946e' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    {getTranslatedText("Estimated Completion Time:")}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: '#64946e' }}>
                  {statusConfig.estimatedTime}
                </span>
              </div>
            </div>
          </div>

          {/* KYC Details */}
          {kycData && (
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-base md:text-lg font-bold mb-4 text-white">
                {getTranslatedText("Submitted Details")}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{getTranslatedText("Aadhaar Number:")}</span>
                  <span className="text-sm font-semibold text-white">
                    {kycData.aadhaarNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{getTranslatedText("Submitted On:")}</span>
                  <span className="text-sm font-semibold text-white">
                    {new Date(kycData.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{getTranslatedText("Status:")}</span>
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${statusConfig.color}20`,
                      color: statusConfig.color
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {kycStatus === 'rejected' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/scrapper/kyc')}
                className="w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {getTranslatedText("Resubmit KYC")}
              </motion.button>
            )}

            {kycStatus === 'verified' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Check subscription status before redirecting
                  const subscriptionStatus = localStorage.getItem('scrapperSubscriptionStatus');
                  if (subscriptionStatus === 'active') {
                    navigate('/scrapper', { replace: true });
                  } else {
                    navigate('/scrapper/subscription', { replace: true });
                  }
                }}
                className="w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {getTranslatedText("Continue to Subscription")}
              </motion.button>
            )}

            {kycStatus === 'pending' && (
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#f59e0b' }}>
                  ⏳ {getTranslatedText("Waiting for Verification")}
                </p>
                <p className="text-xs text-gray-400">
                  {getTranslatedText("Your KYC is under review. You'll be automatically redirected to dashboard once verified.")}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4 md:p-6 shadow-lg bg-zinc-900 border border-white/10"
        >
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0 mt-0.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
            </svg>
            <div>
              <p className="text-sm font-semibold mb-2 text-white">
                {getTranslatedText("What happens next?")}
              </p>
              <ul className="text-xs md:text-sm space-y-1 text-gray-400">
                <li>• {getTranslatedText("Our admin team will verify your documents")}</li>
                <li>• {getTranslatedText("Verification typically takes 24-48 hours")}</li>
                <li>• {getTranslatedText("You'll receive a notification once verification is complete")}</li>
                <li>• {getTranslatedText("Once verified, you can start receiving pickup requests")}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default KYCStatusPage;

