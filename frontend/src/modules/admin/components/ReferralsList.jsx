import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { referralAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaGift,
  FaSearch,
  FaFilter,
  FaUsers,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaRupeeSign,
  FaEye,
  FaBan,
  FaSpinner
} from 'react-icons/fa';

const ReferralsList = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const staticTexts = [
    "No Referrals Found",
    "Try adjusting your filters",
    "No referrals have been created yet",
    "All Referrals",
    "View and manage all referral relationships",
    "Total Referrals",
    "Search by code, referrer, or referee name...",
    "All Status",
    "Pending",
    "Registered",
    "Verified",
    "Rejected",
    "Completed",
    "Referrer",
    "Referee",
    "Date",
    "Reward",
    "NO CODE",
    "Unknown"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const response = await referralAPI.getAllReferrals();
      if (response.success && response.data?.referrals) {
        setReferrals(response.data.referrals);
      } else {
        setReferrals([]);
      }
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReferrals = () => {
    let filtered = [...referrals];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ref => ref.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ref =>
        (ref.codeUsed && ref.codeUsed.toLowerCase().includes(term)) ||
        (ref.referrer?.name && ref.referrer.name.toLowerCase().includes(term)) ||
        (ref.referee?.name && ref.referee.name.toLowerCase().includes(term)) ||
        (ref.referrer?.email && ref.referrer.email.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const filteredReferrals = getFilteredReferrals();

  const getStatusBadge = (status) => {
    const badges = {
      registered: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: FaCheckCircle, text: getTranslatedText('Registered') },
      completed: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: FaCheckCircle, text: getTranslatedText('Completed') },
      pending: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', icon: FaClock, text: getTranslatedText('Pending') },
      rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: FaBan, text: getTranslatedText('Rejected') },
      verified: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: FaCheckCircle, text: getTranslatedText('Verified') }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        <Icon />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
            >
              <FaGift className="text-3xl" style={{ color: '#64946e' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d3748' }}>
                {getTranslatedText("All Referrals")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("View and manage all referral relationships")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: '#64946e' }}>
              {referrals.length}
            </p>
            <p className="text-xs" style={{ color: '#718096' }}>
              {getTranslatedText("Total Referrals")}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#718096' }} />
            <input
              type="text"
              placeholder={getTranslatedText("Search by code, referrer, or referee name...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
              style={{
                borderColor: '#e2e8f0',
                backgroundColor: '#f7fafc',
                color: '#2d3748'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
            style={{
              borderColor: '#e2e8f0',
              backgroundColor: '#f7fafc',
              color: '#2d3748'
            }}
          >
            <option value="all">{getTranslatedText("All Status")}</option>
            <option value="pending">{getTranslatedText("Pending")}</option>
            <option value="registered">{getTranslatedText("Registered")}</option>
            <option value="verified">{getTranslatedText("Verified")}</option>
            <option value="rejected">{getTranslatedText("Rejected")}</option>
          </select>
        </div>
      </motion.div>

      {/* Referrals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[400px]"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="animate-spin text-4xl text-green-600" />
          </div>
        ) : (
          <AnimatePresence>
            {filteredReferrals.length === 0 ? (
              <div className="p-12 text-center">
                <FaGift className="text-5xl mx-auto mb-4" style={{ color: '#cbd5e0' }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("No Referrals Found")}
                </h3>
                <p className="text-sm" style={{ color: '#718096' }}>
                  {searchTerm || filterStatus !== 'all'
                    ? getTranslatedText('Try adjusting your filters')
                    : getTranslatedText('No referrals have been created yet')}
                </p>
              </div>
            ) : (
              filteredReferrals.map((referral, index) => (
                <motion.div
                  key={referral._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredReferrals.length - 1 ? 'border-b' : ''
                    }`}
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Referral Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
                        >
                          <FaGift style={{ color: '#64946e', fontSize: '20px' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                              {referral.codeUsed || getTranslatedText('NO CODE')}
                            </h3>
                            {getStatusBadge(referral.status)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs md:text-sm" style={{ color: '#718096' }}>
                            <div className="truncate">
                              <span className="font-semibold block text-gray-800">{getTranslatedText("Referrer")}</span>
                              {referral.referrer?.name ? `${referral.referrer.name}` : (referral.referrer || getTranslatedText('Unknown'))}
                              {referral.referrer?.email && <span className="block text-xs text-gray-400">{referral.referrer.email}</span>}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold block text-gray-800">{getTranslatedText("Referee")}</span>
                              {referral.referee?.name ? `${referral.referee.name}` : (referral.refereeEmail || referral.refereePhone || getTranslatedText('Pending'))}
                            </div>
                            <div>
                              <span className="font-semibold block text-gray-800">{getTranslatedText("Date")}</span>
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-semibold block text-gray-800">{getTranslatedText("Reward")}</span>
                              <span className="text-green-600 font-bold">₹{referral.rewardEarned || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default ReferralsList;
