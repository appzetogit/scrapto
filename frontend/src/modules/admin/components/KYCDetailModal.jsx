import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaUserShield, FaPhone, FaIdCard, FaCar } from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const KYCDetailModal = ({ kyc, onClose, onApprove, onReject }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const staticTexts = [
    "Error: Scrapper ID is missing",
    "Please provide a reason for rejection",
    "Are you sure you want to reject this KYC?",
    "KYC Verification Details",
    "Review all documents before making a decision",
    "Scrapper Information",
    "Name",
    "Phone",
    "Aadhaar Number",
    "Vehicle Info",
    "Documents",
    "Aadhaar Card Photo",
    "Selfie Photo",
    "Rejection Reason *",
    "Please provide a reason for rejection...",
    "✓ Verified on {date}",
    "✗ Rejected on {date}",
    "Reason: {reason}",
    "Reject",
    "Approve",
    "Cancel",
    "Confirm Rejection",
    "Close"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const handleApprove = () => {
    // Add logging
    console.log('Approve clicked for KYC:', kyc);
    const scrapperId = kyc.scrapperId || kyc.id;
    console.log('Scrapper ID:', scrapperId);

    if (!scrapperId) {
      alert(getTranslatedText('Error: Scrapper ID is missing'));
      return;
    }

    // Removed window.confirm to debug blocking issue
    setIsProcessing(true);
    onApprove(scrapperId).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert(getTranslatedText('Please provide a reason for rejection'));
      return;
    }
    if (window.confirm(getTranslatedText('Are you sure you want to reject this KYC?'))) {
      setIsProcessing(true);
      // Use scrapperId if available, otherwise fallback to id
      const scrapperId = kyc.scrapperId || kyc.id;
      onReject(scrapperId, rejectionReason).finally(() => {
        setIsProcessing(false);
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 md:p-6 flex items-center justify-between z-10" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#f7fafc' }}
              >
                <FaUserShield style={{ color: '#64946e', fontSize: '24px' }} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#2d3748' }}>
                  {getTranslatedText("KYC Verification Details")}
                </h2>
                <p className="text-sm" style={{ color: '#718096' }}>
                  {getTranslatedText("Review all documents before making a decision")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <FaTimes style={{ color: '#718096' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-6">
            {/* Scrapper Information */}
            <div className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4">
              <h3 className="text-lg font-bold" style={{ color: '#2d3748' }}>
                {getTranslatedText("Scrapper Information")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <FaUserShield style={{ color: '#64946e' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Name")}</p>
                    <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.scrapperName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone style={{ color: '#64946e' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Phone")}</p>
                    <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.scrapperPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaIdCard style={{ color: '#64946e' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Aadhaar Number")}</p>
                    <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.aadhaarNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCar style={{ color: '#64946e' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Vehicle Info")}</p>
                    <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.vehicleInfo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold" style={{ color: '#2d3748' }}>
                {getTranslatedText("Documents")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aadhaar Photo */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Aadhaar Card Photo")}
                  </label>
                  <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                    <img
                      src={kyc.aadhaarPhotoUrl}
                      alt="Aadhaar Card"
                      className="w-full h-64 object-contain bg-gray-50"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Aadhaar+Card';
                      }}
                    />
                  </div>
                </div>

                {/* Selfie Photo */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Selfie Photo")}
                  </label>
                  <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                    <img
                      src={kyc.selfieUrl}
                      alt="Selfie"
                      className="w-full h-64 object-contain bg-gray-50"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x400?text=Selfie';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason Form */}
            <AnimatePresence>
              {showRejectForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-semibold" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Rejection Reason *")}
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={getTranslatedText("Please provide a reason for rejection...")}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#e2e8f0',
                      focusBorderColor: '#64946e',
                      focusRingColor: '#64946e'
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status History */}
            {kyc.verifiedAt && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm" style={{ color: '#059669' }}>
                  {getTranslatedText("✓ Verified on {date}", { date: new Date(kyc.verifiedAt).toLocaleString() })}
                </p>
              </div>
            )}
            {kyc.rejectedAt && (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm font-semibold mb-1" style={{ color: '#dc2626' }}>
                  {getTranslatedText("✗ Rejected on {date}", { date: new Date(kyc.rejectedAt).toLocaleString() })}
                </p>
                {kyc.rejectionReason && (
                  <p className="text-sm" style={{ color: '#991b1b' }}>
                    {getTranslatedText("Reason: {reason}", { reason: kyc.rejectionReason })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t p-4 md:p-6 flex flex-col sm:flex-row gap-3 justify-end" style={{ borderColor: '#e2e8f0' }}>
            {kyc.status === 'pending' && (
              <>
                {!showRejectForm ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRejectForm(true)}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                      disabled={isProcessing}
                    >
                      <FaTimesCircle />
                      {getTranslatedText("Reject")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApprove}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      disabled={isProcessing}
                    >
                      <FaCheckCircle />
                      {getTranslatedText("Approve")}
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className="px-6 py-3 rounded-xl font-semibold transition-all"
                      style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                      disabled={isProcessing}
                    >
                      {getTranslatedText("Cancel")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReject}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                      disabled={isProcessing || !rejectionReason.trim()}
                    >
                      <FaTimesCircle />
                      {getTranslatedText("Confirm Rejection")}
                    </motion.button>
                  </>
                )}
              </>
            )}
            {kyc.status !== 'pending' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#64946e', color: '#ffffff' }}
              >
                {getTranslatedText("Close")}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KYCDetailModal;

