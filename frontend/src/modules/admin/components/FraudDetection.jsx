import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { referralAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaSearch,
  FaFilter,
  FaSpinner
} from 'react-icons/fa';

const FraudDetection = () => {
  const [flaggedReferrals, setFlaggedReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all'); // all, high, medium, low
  const staticTexts = [
    "Failed to load flagged referrals",
    "Approve this referral? This will mark it as verified.",
    "Manually approved by admin from fraud detection.",
    "Referral approved successfully",
    "Failed to approve referral",
    "Error approving referral",
    "Enter rejection reason:",
    "Rejected by admin: {reason}",
    "Referral rejected successfully",
    "Failed to reject referral",
    "Error rejecting referral",
    "HIGH",
    "MEDIUM",
    "LOW",
    "Fraud Detection",
    "Review and manage flagged referrals",
    "Flagged Referrals",
    "Search by code, referrer, or referee...",
    "All Severities",
    "High",
    "Medium",
    "Low",
    "No Flagged Referrals",
    "Try adjusting your filters",
    "All referrals are clean!",
    "No Code",
    "Referrer:",
    "Referee:",
    "Date:",
    "Fraud Flags ({count}):",
    "Review",
    "Referral Details",
    "Referral Code",
    "None",
    "Referrer",
    "Referee",
    "Created At",
    "Device Info",
    "IP Address",
    "Approve",
    "Reject"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadFlaggedReferrals();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [searchTerm, filterSeverity, flaggedReferrals]);

  const loadFlaggedReferrals = async () => {
    setLoading(true);
    try {
      const response = await referralAPI.getAllReferrals();
      if (response.success && response.data?.referrals) {
        // Filter only those with fraudFlags or status='fraud'
        const flagged = response.data.referrals.filter(ref =>
          (ref.fraudFlags && ref.fraudFlags.length > 0) || ref.status === 'fraud'
        );
        setFlaggedReferrals(flagged);
        setFilteredReferrals(flagged);
      }
    } catch (err) {
      console.error('Failed to load flagged referrals', err);
      // Optional: Add localized alert or error state if needed
    } finally {
      setLoading(false);
    }
  };

  const filterReferrals = () => {
    let filtered = [...flaggedReferrals];

    // Filter by severity
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(ref => {
        const hasSeverity = ref.fraudFlags?.some(flag => flag.severity === filterSeverity);
        return hasSeverity;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ref =>
        (ref.codeUsed && ref.codeUsed.toLowerCase().includes(term)) ||
        (ref.referrer?.name && ref.referrer.name.toLowerCase().includes(term)) ||
        (ref.referee?.name && ref.referee.name.toLowerCase().includes(term))
      );
    }

    setFilteredReferrals(filtered);
  };

  const handleApprove = async (referralId) => {
    if (!window.confirm(getTranslatedText('Approve this referral? This will mark it as verified.'))) return;
    try {
      const response = await referralAPI.updateReferral(referralId, {
        status: 'verified',
        // Maybe clear flags or mark resolved? 
        // For now just status change.
        notes: getTranslatedText('Manually approved by admin from fraud detection.')
      });
      if (response.success) {
        setShowDetailModal(false);
        loadFlaggedReferrals(); // Refresh list
        alert(getTranslatedText('Referral approved successfully'));
      } else {
        alert(getTranslatedText('Failed to approve referral'));
      }
    } catch (err) {
      console.error('Error approving referral:', err);
      alert(getTranslatedText('Error approving referral'));
    }
  };

  const handleReject = async (referralId, reason) => {
    const reasonText = reason || prompt(getTranslatedText('Enter rejection reason:'));
    if (reasonText) {
      try {
        const response = await referralAPI.updateReferral(referralId, {
          status: 'rejected', // or 'fraud'
          notes: getTranslatedText('Rejected by admin: {reason}', { reason: reasonText })
        });
        if (response.success) {
          setShowDetailModal(false);
          loadFlaggedReferrals();
          alert(getTranslatedText('Referral rejected successfully'));
        } else {
          alert(getTranslatedText('Failed to reject referral'));
        }
      } catch (err) {
        console.error('Error rejecting referral:', err);
        alert(getTranslatedText('Error rejecting referral'));
      }
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      high: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: FaExclamationTriangle },
      medium: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', icon: FaExclamationTriangle },
      low: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: FaExclamationTriangle }
    };
    const badge = badges[severity] || badges.medium;
    const Icon = badge.icon;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        <Icon />
        {getTranslatedText(severity.toUpperCase())}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

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
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <FaShieldAlt className="text-3xl" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d3748' }}>
                {getTranslatedText("Fraud Detection")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("Review and manage flagged referrals")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              {flaggedReferrals.length}
            </p>
            <p className="text-xs" style={{ color: '#718096' }}>
              {getTranslatedText("Flagged Referrals")}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#718096' }} />
            <input
              type="text"
              placeholder={getTranslatedText("Search by code, referrer, or referee...")}
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
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
            style={{
              borderColor: '#e2e8f0',
              backgroundColor: '#f7fafc',
              color: '#2d3748'
            }}
          >
            <option value="all">{getTranslatedText("All Severities")}</option>
            <option value="high">{getTranslatedText("High")}</option>
            <option value="medium">{getTranslatedText("Medium")}</option>
            <option value="low">{getTranslatedText("Low")}</option>
          </select>
        </div>
      </motion.div>

      {/* Flagged Referrals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[400px]"
      >
        <AnimatePresence>
          {filteredReferrals.length === 0 ? (
            <div className="p-12 text-center">
              <FaShieldAlt className="text-5xl mx-auto mb-4" style={{ color: '#cbd5e0' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("No Flagged Referrals")}
              </h3>
              <p className="text-sm" style={{ color: '#718096' }}>
                {searchTerm || filterSeverity !== 'all'
                  ? getTranslatedText('Try adjusting your filters')
                  : getTranslatedText('All referrals are clean!')}
              </p>
            </div>
          ) : (
            filteredReferrals.map((referral, index) => {
              const highestSeverity = referral.fraudFlags?.reduce((highest, flag) => {
                const severityOrder = { high: 3, medium: 2, low: 1 };
                return severityOrder[flag.severity] > (severityOrder[highest?.severity] || 0)
                  ? flag
                  : highest;
              }, null);

              return (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 md:p-6 hover:bg-gray-50 transition-all cursor-pointer ${index !== filteredReferrals.length - 1 ? 'border-b' : ''
                    }`}
                  style={{ borderColor: '#e2e8f0' }}
                  onClick={() => {
                    setSelectedReferral(referral);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        >
                          <FaShieldAlt style={{ color: '#ef4444', fontSize: '20px' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                              {referral.codeUsed || getTranslatedText('No Code')}
                            </h3>
                            {highestSeverity && getSeverityBadge(highestSeverity.severity)}

                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs md:text-sm" style={{ color: '#718096' }}>
                            <div>
                              <span className="font-semibold">{getTranslatedText("Referrer:")}</span> {referral.referrer?.name || referral.referrerId}
                            </div>
                            <div>
                              <span className="font-semibold">{getTranslatedText("Referee:")}</span> {referral.referee?.name || referral.refereeId}
                            </div>
                            <div>
                              <span className="font-semibold">{getTranslatedText("Date:")}</span> {new Date(referral.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-semibold mb-1" style={{ color: '#2d3748' }}>
                              {getTranslatedText("Fraud Flags ({count}):", { count: referral.fraudFlags?.length || 0 })}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {referral.fraudFlags?.map((flag, flagIndex) => (
                                <span
                                  key={flagIndex}
                                  className="px-2 py-1 rounded text-xs"
                                  style={{
                                    backgroundColor: flag.severity === 'high'
                                      ? 'rgba(239, 68, 68, 0.1)'
                                      : flag.severity === 'medium'
                                        ? 'rgba(251, 191, 36, 0.1)'
                                        : 'rgba(59, 130, 246, 0.1)',
                                    color: flag.severity === 'high'
                                      ? '#ef4444'
                                      : flag.severity === 'medium'
                                        ? '#fbbf24'
                                        : '#3b82f6'
                                  }}
                                >
                                  {flag.type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReferral(referral);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      >
                        <FaEye className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("Review")}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReferral && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Referral Details")}
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <FaTimesCircle style={{ color: '#718096' }} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#718096' }}>{getTranslatedText("Referral Code")}</p>
                    <p className="text-base" style={{ color: '#2d3748' }}>{selectedReferral.codeUsed || getTranslatedText('None')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#718096' }}>{getTranslatedText("Referrer")}</p>
                      <p className="text-base" style={{ color: '#2d3748' }}>{selectedReferral.referrer?.name} ({selectedReferral.referrer?.email})</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#718096' }}>{getTranslatedText("Referee")}</p>
                      <p className="text-base" style={{ color: '#2d3748' }}>{selectedReferral.referee?.name} ({selectedReferral.referee?.email})</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#718096' }}>{getTranslatedText("Created At")}</p>
                    <p className="text-base" style={{ color: '#2d3748' }}>{new Date(selectedReferral.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#718096' }}>{getTranslatedText("Fraud Flags")}</p>
                    <div className="space-y-2">
                      {selectedReferral.fraudFlags?.map((flag, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border"
                          style={{
                            borderColor: flag.severity === 'high' ? '#ef4444' : flag.severity === 'medium' ? '#fbbf24' : '#3b82f6',
                            backgroundColor: flag.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : flag.severity === 'medium' ? 'rgba(251, 191, 36, 0.05)' : 'rgba(59, 130, 246, 0.05)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getSeverityBadge(flag.severity)}
                            <span className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                              {flag.type}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: '#718096' }}>{flag.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedReferral.deviceInfo && (
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#718096' }}>{getTranslatedText("Device Info")}</p>
                      <p className="text-xs" style={{ color: '#2d3748' }}>{selectedReferral.deviceInfo}</p>
                    </div>
                  )}
                  {selectedReferral.ipAddress && (
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#718096' }}>{getTranslatedText("IP Address")}</p>
                      <p className="text-xs" style={{ color: '#2d3748' }}>{selectedReferral.ipAddress}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApprove(selectedReferral._id)}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                  >
                    <FaCheckCircle />
                    {getTranslatedText("Approve")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReject(selectedReferral._id)}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                  >
                    <FaTimesCircle />
                    {getTranslatedText("Reject")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FraudDetection;
