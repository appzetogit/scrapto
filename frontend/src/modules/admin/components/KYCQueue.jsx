import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaEye, FaClock, FaFilter } from 'react-icons/fa';
import KYCDetailModal from './KYCDetailModal';
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const KYCQueue = () => {
  const [kycList, setKycList] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const staticTexts = [
    "Failed to load KYC data",
    "Failed to update KYC status. Please try again.",
    "Pending",
    "Verified",
    "Rejected",
    "{count} min ago",
    "{count} hour ago",
    "{count} hours ago",
    "{count} day ago",
    "{count} days ago",
    "KYC Verification Queue",
    "Review and verify scrapper KYC submissions",
    "{count} Pending",
    "Search by name, phone, or Aadhaar...",
    "all",
    "pending",
    "verified",
    "rejected",
    "Loading KYC data...",
    "Error loading KYC data",
    "Retry",
    "No KYC submissions found",
    "Try a different search term",
    "All KYC submissions have been processed",
    "🆔 Aadhaar: {number}",
    "Submitted {time}",
    "View Details",
    "View",
    "Not provided"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadKYCData();
  }, [filter]);

  const loadKYCData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch scrappers with KYC status from backend
      const queryParams = new URLSearchParams();
      if (filter !== 'all' && ['pending', 'verified', 'rejected'].includes(filter)) {
        queryParams.append('status', filter);
      }
      queryParams.append('page', '1');
      queryParams.append('limit', '100');

      const response = await adminAPI.getScrappersWithKyc(queryParams.toString());

      if (response.success && response.data?.scrappers) {
        // Transform backend data to frontend format
        const transformedKYCs = response.data.scrappers
          .filter(scrapper => scrapper.kyc) // Only show scrappers with KYC data
          .map((scrapper) => ({
            id: scrapper._id || scrapper.id,
            scrapperId: scrapper._id || scrapper.id,
            scrapperName: scrapper.name || 'N/A',
            scrapperPhone: scrapper.phone || 'N/A',
            aadhaarNumber: scrapper.kyc?.aadhaarNumber ?
              `${scrapper.kyc.aadhaarNumber.substring(0, 4)}-****-${scrapper.kyc.aadhaarNumber.substring(8)}` :
              'N/A',
            aadhaarPhotoUrl: scrapper.kyc?.aadhaarPhotoUrl || null,
            selfieUrl: scrapper.kyc?.selfieUrl || null,
            licenseUrl: scrapper.kyc?.licenseUrl || null,
            status: scrapper.kyc?.status || 'not_submitted',
            submittedAt: scrapper.createdAt || new Date().toISOString(),
            verifiedAt: scrapper.kyc?.verifiedAt || null,
            rejectedAt: scrapper.kyc?.status === 'rejected' ? scrapper.updatedAt : null,
            rejectionReason: scrapper.kyc?.rejectionReason || null,
            vehicleInfo: scrapper.vehicleInfo ?
              `${scrapper.vehicleInfo.type || ''} - ${scrapper.vehicleInfo.number || ''}` :
              getTranslatedText('Not provided'),
            kycData: scrapper.kyc || null
          }));
        setKycList(transformedKYCs);
      } else {
        setError(getTranslatedText('Failed to load KYC data'));
        setKycList([]);
      }
    } catch (err) {
      console.error('Error loading KYC data:', err);
      setError(err.message || getTranslatedText('Failed to load KYC data'));
      setKycList([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredKYCs = kycList.filter(kyc => {
    const matchesFilter = filter === 'all' || kyc.status === filter;
    const matchesSearch =
      kyc.scrapperName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.scrapperPhone.includes(searchQuery) ||
      kyc.aadhaarNumber.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const handleViewDetails = (kyc) => {
    // Ensure scrapperId is set (it's the same as id in our transformed data)
    setSelectedKYC({
      ...kyc,
      scrapperId: kyc.scrapperId || kyc.id
    });
    setShowModal(true);
  };

  const handleKYCUpdate = async (scrapperId, newStatus, reason = '') => {
    console.log('handleKYCUpdate called:', { scrapperId, newStatus, reason });
    try {
      // Call backend API to verify/reject KYC
      if (newStatus === 'verified') {
        await adminAPI.verifyKyc(scrapperId);
      } else if (newStatus === 'rejected') {
        await adminAPI.rejectKyc(scrapperId, reason);
      }
      console.log('API call successful');

      // Reload KYC data from backend to get updated status
      await loadKYCData();

      setShowModal(false);
      setSelectedKYC(null);
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert(error.message || getTranslatedText('Failed to update KYC status. Please try again.'));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#f59e0b', icon: FaClock },
      verified: { bg: '#d1fae5', color: '#10b981', icon: FaCheckCircle },
      rejected: { bg: '#fee2e2', color: '#ef4444', icon: FaTimesCircle }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span
        className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <Icon className="text-xs" />
        <span className="hidden sm:inline">{getTranslatedText(status.charAt(0).toUpperCase() + status.slice(1))}</span>
        <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
      </span>
    );
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return getTranslatedText("{count} min ago", { count: diffMins });
    if (diffHours < 24) return getTranslatedText(diffHours > 1 ? "{count} hours ago" : "{count} hour ago", { count: diffHours });
    return getTranslatedText(diffDays > 1 ? "{count} days ago" : "{count} day ago", { count: diffDays });
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
              {getTranslatedText("KYC Verification Queue")}
            </h1>
            <p className="text-xs md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Review and verify scrapper KYC submissions")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("{count} Pending", { count: filteredKYCs.filter(k => k.status === 'pending').length })}
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
          <div className="flex-1">
            <input
              type="text"
              placeholder={getTranslatedText("Search by name, phone, or Aadhaar...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base"
              style={{
                borderColor: '#e2e8f0',
                focusBorderColor: '#64946e',
                focusRingColor: '#64946e'
              }}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            {['all', 'pending', 'verified', 'rejected'].map((status) => (
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
                {getTranslatedText(status)}
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
            {getTranslatedText("Loading KYC data...")}
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
            {getTranslatedText("Error loading KYC data")}
          </h3>
          <p className="text-sm md:text-base mb-4" style={{ color: '#718096' }}>
            {error}
          </p>
          <button
            onClick={loadKYCData}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#64946e' }}
          >
            {getTranslatedText("Retry")}
          </button>
        </motion.div>
      )}

      {/* KYC List */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <AnimatePresence>
            {filteredKYCs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center"
              >
                <FaUserShield className="mx-auto mb-4" style={{ color: '#cbd5e0', fontSize: '48px' }} />
                <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("No KYC submissions found")}
                </p>
                <p className="text-sm" style={{ color: '#718096' }}>
                  {searchQuery ? getTranslatedText('Try a different search term') : getTranslatedText('All KYC submissions have been processed')}
                </p>
              </motion.div>
            ) : (
              filteredKYCs.map((kyc, index) => (
                <motion.div
                  key={kyc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredKYCs.length - 1 ? 'border-b' : ''
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
                          <FaUserShield style={{ color: '#64946e' }} className="text-lg md:text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 flex-wrap">
                            <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                              {kyc.scrapperName}
                            </h3>
                            {getStatusBadge(kyc.status)}
                          </div>
                          <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm" style={{ color: '#718096' }}>
                            <p>📱 {kyc.scrapperPhone}</p>
                            <p>{getTranslatedText("🆔 Aadhaar: {number}", { number: kyc.aadhaarNumber })}</p>
                            <p>🚗 {kyc.vehicleInfo}</p>
                            <p className="text-xs">{getTranslatedText("Submitted {time}", { time: getTimeAgo(kyc.submittedAt) })}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(kyc)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      >
                        <FaEye className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("View Details")}</span>
                        <span className="sm:hidden">{getTranslatedText("View")}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* KYC Detail Modal */}
      <AnimatePresence>
        {showModal && selectedKYC && (
          <KYCDetailModal
            kyc={selectedKYC}
            onClose={() => {
              setShowModal(false);
              setSelectedKYC(null);
            }}
            onApprove={(scrapperId) => handleKYCUpdate(scrapperId, 'verified')}
            onReject={(scrapperId, reason) => handleKYCUpdate(scrapperId, 'rejected', reason)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KYCQueue;

