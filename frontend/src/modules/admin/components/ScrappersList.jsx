import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTruck, FaSearch, FaUserCheck, FaUserTimes, FaEye, FaPhone,
  FaIdCard, FaStar, FaRupeeSign, FaCheckCircle, FaClock, FaTimesCircle
} from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrappersList = () => {
  const navigate = useNavigate();
  const [scrappers, setScrappers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, verified, pending, rejected, blocked
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const staticTexts = [
    "Failed to load scrappers",
    "Blocked",
    "Not Submitted",
    "Verified",
    "Pending",
    "Rejected",
    "Active",
    "Not Subscribed",
    "Scrapper Management",
    "Manage all registered scrappers on the platform",
    "{count} Total Scrappers",
    "Search by name, phone, or vehicle...",
    "all",
    "verified",
    "pending",
    "rejected",
    "blocked",
    "Loading scrappers...",
    "Error loading scrappers",
    "Retry",
    "No scrappers found",
    "Try a different search term",
    "No scrappers registered yet",
    "{count} Pickups",
    "View",
    "Block",
    "Unblock",
    "Are you sure you want to {action} this scrapper?",
    "unblock",
    "block",
    "Scrapper {status} successfully!",
    "Failed to update scrapper status",
    "Failed to update scrapper status. Please try again.",
    "Not provided"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadScrappersData();
  }, [filter]);

  const loadScrappersData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (filter !== 'all' && ['pending', 'verified', 'rejected'].includes(filter)) {
        queryParams.append('status', filter);
      }
      queryParams.append('page', '1');
      queryParams.append('limit', '100');

      const response = await adminAPI.getScrappersWithKyc(queryParams.toString());

      if (response.success && response.data?.scrappers) {
        // Transform backend data to frontend format
        const transformedScrappers = response.data.scrappers.map((scrapper) => ({
          id: scrapper._id || scrapper.id,
          name: scrapper.name || 'N/A',
          phone: scrapper.phone || 'N/A',
          kycStatus: scrapper.kyc?.status || 'not_submitted',
          status: scrapper.status || 'active',
          subscriptionStatus: scrapper.subscription?.status || 'expired',
          rating: scrapper.rating || 0,
          totalPickups: scrapper.totalPickups || 0,
          totalEarnings: scrapper.earnings?.total || 0,
          vehicleInfo: scrapper.vehicleInfo ?
            `${scrapper.vehicleInfo.type || ''} - ${scrapper.vehicleInfo.number || ''}` :
            getTranslatedText('Not provided'),
          joinedAt: scrapper.createdAt || new Date().toISOString(),
          kycData: scrapper.kyc || null,
          subscriptionData: scrapper.subscription || null
        }));
        setScrappers(transformedScrappers);
      } else {
        setError(getTranslatedText('Failed to load scrappers'));
        setScrappers([]);
      }
    } catch (err) {
      console.error('Error loading scrappers:', err);
      setError(err.message || getTranslatedText('Failed to load scrappers'));
      setScrappers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredScrappers = scrappers.filter(scrapper => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'blocked'
          ? scrapper.status === 'blocked'
          : scrapper.kycStatus === filter;
    const matchesSearch =
      scrapper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scrapper.phone.includes(searchQuery) ||
      scrapper.vehicleInfo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewDetails = (scrapperId) => {
    navigate(`/admin/scrappers/${scrapperId}`);
  };

  const getKYCStatusBadge = (status, scrapperStatus) => {
    const styles = {
      verified: { bg: '#d1fae5', color: '#10b981', icon: FaCheckCircle },
      pending: { bg: '#fef3c7', color: '#f59e0b', icon: FaClock },
      rejected: { bg: '#fee2e2', color: '#ef4444', icon: FaUserTimes },
      not_submitted: { bg: '#e2e8f0', color: '#718096', icon: FaIdCard }
    };
    const style = styles[status] || styles.not_submitted;
    const Icon = style.icon;
    return (
      <span
        className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <Icon className="text-xs" />
        <span className="hidden sm:inline">
          {scrapperStatus === 'blocked'
            ? getTranslatedText('Blocked')
            : status === 'not_submitted'
              ? getTranslatedText('Not Submitted')
              : getTranslatedText(status.charAt(0).toUpperCase() + status.slice(1))}
        </span>
        <span className="sm:hidden">
          {scrapperStatus === 'blocked'
            ? 'B'
            : status === 'not_submitted'
              ? 'N'
              : status.charAt(0).toUpperCase()}
        </span>
      </span>
    );
  };

  const getSubscriptionBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
          <FaCheckCircle className="text-xs" />
          <span className="hidden sm:inline">{getTranslatedText("Active")}</span>
          <span className="sm:hidden">A</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
        <FaTimesCircle className="text-xs" />
        <span className="hidden sm:inline">{getTranslatedText("Not Subscribed")}</span>
        <span className="sm:hidden">N</span>
      </span>
    );
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-3 md:p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Scrapper Management")}
            </h1>
            <p className="text-xs md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Manage all registered scrappers on the platform")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("{count} Total Scrappers", { count: scrappers.length })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-3 md:p-6"
      >
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-xs md:text-base" style={{ color: '#718096' }} />
            <input
              type="text"
              placeholder={getTranslatedText("Search by name, phone, or vehicle...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base"
              style={{
                borderColor: '#e2e8f0',
                focusBorderColor: '#64946e',
                focusRingColor: '#64946e'
              }}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            {['all', 'verified', 'pending', 'rejected', 'blocked'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-2.5 py-1.5 md:px-4 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all ${filter === status ? 'shadow-md' : ''
                  }`}
                style={{
                  backgroundColor: filter === status ? '#64946e' : '#f7fafc',
                  color: filter === status ? '#ffffff' : '#2d3748'
                }}
              >
                {status === 'all'
                  ? getTranslatedText('all')
                  : status === 'blocked'
                    ? getTranslatedText('blocked')
                    : getTranslatedText(status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Loading / Error State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }} />
          <p className="text-sm md:text-base font-semibold" style={{ color: '#2d3748' }}>
            {getTranslatedText("Loading scrappers...")}
          </p>
        </motion.div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
        >
          <FaTimesCircle className="mx-auto mb-4 text-4xl" style={{ color: '#ef4444' }} />
          <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#2d3748' }}>
            {getTranslatedText("Error loading scrappers")}
          </h3>
          <p className="text-sm md:text-base mb-4" style={{ color: '#718096' }}>
            {error}
          </p>
          <button
            onClick={loadScrappersData}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#64946e' }}
          >
            {getTranslatedText("Retry")}
          </button>
        </motion.div>
      )}

      {/* Scrappers List */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <AnimatePresence>
            {filteredScrappers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center"
              >
                <FaTruck className="mx-auto mb-4" style={{ color: '#cbd5e0', fontSize: '48px' }} />
                <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("No scrappers found")}
                </p>
                <p className="text-sm" style={{ color: '#718096' }}>
                  {searchQuery ? getTranslatedText('Try a different search term') : getTranslatedText('No scrappers registered yet')}
                </p>
              </motion.div>
            ) : (
              filteredScrappers.map((scrapper, index) => (
                <motion.div
                  key={scrapper.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredScrappers.length - 1 ? 'border-b' : ''
                    }`}
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    {/* Scrapper Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-2 md:gap-4">
                        <div
                          className="w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#f7fafc' }}
                        >
                          <FaTruck className="text-lg md:text-2xl" style={{ color: '#64946e' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 flex-wrap">
                            <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                              {scrapper.name}
                            </h3>
                            {getKYCStatusBadge(scrapper.kycStatus, scrapper.status)}
                            {getSubscriptionBadge(scrapper.subscriptionStatus)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2 text-xs md:text-sm" style={{ color: '#718096' }}>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaPhone className="text-xs" />
                              <span className="truncate">{scrapper.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaStar className="text-xs" style={{ color: '#fbbf24' }} />
                              <span>{scrapper.rating > 0 ? scrapper.rating.toFixed(1) : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaCheckCircle className="text-xs" />
                              <span>{getTranslatedText("{count} Pickups", { count: scrapper.totalPickups })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaRupeeSign className="text-xs" />
                              <span>₹{scrapper.totalEarnings.toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-xs mt-1 md:mt-2" style={{ color: '#718096' }}>
                            🚗 {scrapper.vehicleInfo}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(scrapper.id)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      >
                        <FaEye className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("View")}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          const nextStatus = scrapper.status === 'blocked' ? 'active' : 'blocked';
                          const actionText = scrapper.status === 'blocked' ? getTranslatedText('unblock') : getTranslatedText('block');
                          if (
                            window.confirm(
                              getTranslatedText('Are you sure you want to {action} this scrapper?', { action: actionText })
                            )
                          ) {
                            try {
                              const response = await adminAPI.updateScrapperStatus(scrapper.id, nextStatus);
                              if (response.success) {
                                // Update local state list
                                setScrappers((prev) =>
                                  prev.map((s) =>
                                    s.id === scrapper.id
                                      ? {
                                        ...s,
                                        status: nextStatus
                                      }
                                      : s
                                  )
                                );
                                alert(getTranslatedText(`Scrapper {status} successfully!`, { status: nextStatus === 'blocked' ? getTranslatedText('blocked') : getTranslatedText('unblocked') }));
                              } else {
                                throw new Error(response.message || getTranslatedText('Failed to update scrapper status'));
                              }
                            } catch (error) {
                              console.error('Error updating scrapper status:', error);
                              alert(error.message || getTranslatedText('Failed to update scrapper status. Please try again.'));
                            }
                          }
                        }}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{
                          backgroundColor: scrapper.status === 'blocked' ? '#dcfce7' : '#fee2e2',
                          color: scrapper.status === 'blocked' ? '#166534' : '#b91c1c'
                        }}
                      >
                        {scrapper.status === 'blocked' ? (
                          <FaUserCheck className="text-xs md:text-sm" />
                        ) : (
                          <FaUserTimes className="text-xs md:text-sm" />
                        )}
                        <span className="hidden sm:inline">
                          {scrapper.status === 'blocked' ? getTranslatedText('Unblock') : getTranslatedText('Block')}
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ScrappersList;

