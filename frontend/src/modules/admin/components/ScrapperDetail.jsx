import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaTruck, FaPhone, FaIdCard, FaStar, FaRupeeSign,
  FaCheckCircle, FaTimesCircle, FaClock, FaUserTimes, FaCar, FaCreditCard, FaChartLine
} from 'react-icons/fa';
import { adminAPI, earningsAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrapperDetail = () => {
  const { scrapperId } = useParams();
  const navigate = useNavigate();
  const [scrapper, setScrapper] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const staticTexts = [
    "Scrapper not found",
    "Failed to load scrapper data",
    "Are you sure you want to verify this KYC?",
    "KYC Verified successfully",
    "Failed to verify KYC: ",
    "Please enter a reason for rejection:",
    "Rejection reason is required.",
    "KYC Rejected successfully",
    "Failed to reject KYC: ",
    "Verified",
    "Pending",
    "Rejected",
    "Loading scrapper details...",
    "Back to Scrappers List",
    "Back to Scrappers",
    "Phone",
    "Aadhaar",
    "Rating",
    "Vehicle",
    "Not provided",
    "Total Pickups",
    "Total Earnings",
    "This Month",
    "KYC Information",
    "Status: ",
    "Aadhaar Number",
    "Verified On",
    "Rejection Reason",
    "Documents",
    "Aadhaar Photo",
    "Driving License",
    "Selfie",
    "No documents uploaded.",
    "Subscription Details",
    "Plan",
    "Price",
    "Expires On",
    "/month",
    "Completed Orders ({count})",
    "No completed orders yet",
    "User: ",
    "Categories: ",
    "Weight: ",
    " kg • Amount Paid: ₹",
    "Location: ",
    "Completed: ",
    "N/A",
    "User"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadScrapperData();
  }, [scrapperId]);

  const loadScrapperData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load scrapper details from backend
      const scrapperResponse = await adminAPI.getScrapperById(scrapperId);
      if (!scrapperResponse.success || !scrapperResponse.data?.scrapper) {
        throw new Error(scrapperResponse.message || getTranslatedText('Scrapper not found'));
      }

      const backendScrapper = scrapperResponse.data.scrapper;

      // Load earnings (unchanged logic)
      let earningsData = { today: 0, week: 0, month: 0, total: 0 };
      try {
        const earningsResponse = await earningsAPI.getScrapperEarnings(scrapperId);
        if (earningsResponse.success && earningsResponse.data?.summary) {
          earningsData = {
            today: earningsResponse.data.summary.today || 0,
            week: earningsResponse.data.summary.week || 0,
            month: earningsResponse.data.summary.month || 0,
            total: earningsResponse.data.summary.total || 0
          };
        }
      } catch (earningsError) {
        console.warn('Failed to load earnings:', earningsError);
      }

      // Transform backend data to frontend format
      const transformedScrapper = {
        id: backendScrapper._id || backendScrapper.id,
        name: backendScrapper.name || getTranslatedText('N/A'),
        phone: backendScrapper.phone || getTranslatedText('N/A'),
        profilePic: backendScrapper.profilePic || null,
        kycStatus: backendScrapper.kyc?.status || 'not_submitted',
        kycData: backendScrapper.kyc || null,
        subscription: backendScrapper.subscription || null,
        // Handle rating object correctly (average vs direct number)
        rating: backendScrapper.rating?.average !== undefined
          ? backendScrapper.rating.average
          : (typeof backendScrapper.rating === 'number' ? backendScrapper.rating : 0),
        // Use real-time total orders from earnings aggregation if available, otherwise fallback to stored count
        totalPickups: earningsData.totalOrders !== undefined
          ? earningsData.totalOrders
          : (backendScrapper.totalPickups || 0),
        totalEarnings: earningsData.total,
        vehicleInfo: backendScrapper.vehicleInfo
          ? `${backendScrapper.vehicleInfo.type || ''} - ${backendScrapper.vehicleInfo.number || ''}`
          : getTranslatedText('Not provided'),
        joinedAt: backendScrapper.createdAt || new Date().toISOString(),
        earnings: earningsData,
        status: backendScrapper.status || 'active'
      };

      setScrapper(transformedScrapper);

      // Load completed orders from earnings summary (which now includes them)
      if (earningsResponse.success && earningsResponse.data?.summary?.orders) {
        const transformedOrders = earningsResponse.data.summary.orders.map((order) => ({
          id: order.id || order._id,
          orderId: order.orderId || order.id || order._id,
          userName: order.userName || getTranslatedText('User'),
          categories: order.scrapType ? order.scrapType.split(', ') : [],
          weight: order.weight || 0,
          paidAmount: order.amount || 0,
          completedAt: order.completedAt || order.createdAt,
          location: order.location || getTranslatedText('N/A')
        }));
        setOrders(transformedOrders);
      } else {
        // Fallback or empty if not in summary
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading scrapper data:', err);
      setError(err.message || getTranslatedText('Failed to load scrapper data'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKYC = async () => {
    if (!window.confirm(getTranslatedText('Are you sure you want to verify this KYC?'))) return;

    setActionLoading(true);
    try {
      await adminAPI.verifyKyc(scrapperId);
      // Reload data to reflect changes
      await loadScrapperData();
      alert(getTranslatedText('KYC Verified successfully'));
    } catch (err) {
      console.error('Error verifying KYC:', err);
      alert(getTranslatedText('Failed to verify KYC: ') + (err.message || getTranslatedText('Unknown error')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKYC = async () => {
    const reason = window.prompt(getTranslatedText('Please enter a reason for rejection:'));
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      alert(getTranslatedText('Rejection reason is required.'));
      return;
    }

    setActionLoading(true);
    try {
      await adminAPI.rejectKyc(scrapperId, reason);
      // Reload data to reflect changes
      await loadScrapperData();
      alert(getTranslatedText('KYC Rejected successfully'));
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      alert(getTranslatedText('Failed to reject KYC: ') + (err.message || getTranslatedText('Unknown error')));
    } finally {
      setActionLoading(false);
    }
  };

  const getKYCStatusBadge = (status) => {
    if (status === 'verified') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
          <FaCheckCircle className="text-xs" />
          {getTranslatedText("Verified")}
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
          <FaClock className="text-xs" />
          {getTranslatedText("Pending")}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
        <FaUserTimes className="text-xs" />
        {getTranslatedText("Rejected")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }} />
          <p style={{ color: '#718096' }}>{getTranslatedText("Loading scrapper details...")}</p>
        </div>
      </div>
    );
  }

  if (error || !scrapper) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
          {error || getTranslatedText('Scrapper not found')}
        </p>
        <button
          onClick={() => navigate('/admin/scrappers')}
          className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
          style={{ backgroundColor: '#64946e' }}
        >
          {getTranslatedText("Back to Scrappers List")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin/scrappers')}
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: '#64946e' }}
      >
        <FaArrowLeft />
        {getTranslatedText("Back to Scrappers")}
      </motion.button>

      {/* Scrapper Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto md:mx-0 overflow-hidden"
            style={{ backgroundColor: '#f7fafc' }}
          >
            {scrapper.profilePic ? (
              <img
                src={scrapper.profilePic}
                alt={scrapper.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaTruck style={{ color: '#64946e', fontSize: '48px' }} />
            )}
          </div>

          {/* Scrapper Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#2d3748' }}>
                {scrapper.name}
              </h1>
              {getKYCStatusBadge(scrapper.kycStatus)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <FaPhone style={{ color: '#64946e' }} />
                <div>
                  <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Phone")}</p>
                  <p className="font-semibold" style={{ color: '#2d3748' }}>{scrapper.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaIdCard style={{ color: '#64946e' }} />
                <div>
                  <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Aadhaar")}</p>
                  <p className="font-semibold" style={{ color: '#2d3748' }}>
                    {scrapper.kycData?.aadhaarNumber
                      ? `${scrapper.kycData.aadhaarNumber.substring(0, 4)}-****-${scrapper.kycData.aadhaarNumber.substring(8)}`
                      : getTranslatedText('N/A')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaStar style={{ color: '#fbbf24' }} />
                <div>
                  <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Rating")}</p>
                  <p className="font-semibold" style={{ color: '#2d3748' }}>
                    {scrapper.rating > 0 ? scrapper.rating.toFixed(1) : getTranslatedText('N/A')} {scrapper.rating > 0 ? '⭐' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaCar style={{ color: '#64946e' }} />
                <div>
                  <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Vehicle")}</p>
                  <p className="font-semibold" style={{ color: '#2d3748' }}>{getTranslatedText(scrapper.vehicleInfo)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: getTranslatedText('Total Pickups'), value: scrapper.totalPickups || 0, icon: FaCheckCircle, color: '#10b981' },
          { label: getTranslatedText('Total Earnings'), value: `₹${((scrapper.totalEarnings || 0) / 1000).toFixed(0)}k`, icon: FaRupeeSign, color: '#8b5cf6' },
          { label: getTranslatedText('Rating'), value: scrapper.rating > 0 ? scrapper.rating.toFixed(1) : getTranslatedText('N/A'), icon: FaStar, color: '#fbbf24' },
          { label: getTranslatedText('This Month'), value: `₹${((scrapper.earnings?.month || 0) / 1000).toFixed(0)}k`, icon: FaChartLine, color: '#06b6d4' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                  <Icon style={{ color: stat.color, fontSize: '20px' }} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold" style={{ color: '#2d3748' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: '#718096' }}>{stat.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* KYC Information */}
      {scrapper.kycData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#2d3748' }}>
              {getTranslatedText("KYC Information")}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-600">
                {getTranslatedText("Status: ")}{getTranslatedText(scrapper.kycStatus.charAt(0).toUpperCase() + scrapper.kycStatus.slice(1))}
              </span>

              {/* KYC Action Buttons */}
              {scrapper.kycStatus === 'pending' && (
                <>
                  <button
                    onClick={handleRejectKYC}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#ef4444', opacity: actionLoading ? 0.7 : 1 }}
                  >
                    <FaTimesCircle />
                    {getTranslatedText("Reject")}
                  </button>
                  <button
                    onClick={handleVerifyKYC}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#10b981', opacity: actionLoading ? 0.7 : 1 }}
                  >
                    <FaCheckCircle />
                    {getTranslatedText("Verify")}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs mb-1" style={{ color: '#718096' }}>{getTranslatedText("Aadhaar Number")}</p>
              <p className="font-semibold" style={{ color: '#2d3748' }}>{scrapper.kycData.aadhaarNumber || getTranslatedText('Not provided')}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#718096' }}>{getTranslatedText("Verified On")}</p>
              <p className="font-semibold" style={{ color: '#2d3748' }}>
                {scrapper.kycData.verifiedAt ? new Date(scrapper.kycData.verifiedAt).toLocaleDateString() : getTranslatedText('N/A')}
              </p>
            </div>
            {scrapper.kycData.rejectionReason && (
              <div className="md:col-span-2 bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs mb-1 text-red-600 font-semibold">{getTranslatedText("Rejection Reason")}</p>
                <p className="text-sm text-red-800">{scrapper.kycData.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* KYC Documents */}
          <h3 className="text-md font-semibold mb-3 border-t pt-4" style={{ color: '#4a5568' }}>{getTranslatedText("Documents")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scrapper.kycData.aadhaarPhotoUrl && (
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: '#718096' }}>{getTranslatedText("Aadhaar Photo")}</p>
                <div className="border rounded-lg overflow-hidden h-40 bg-gray-50 flex items-center justify-center">
                  <img src={scrapper.kycData.aadhaarPhotoUrl} alt={getTranslatedText("Aadhaar Photo")} className="max-w-full max-h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(scrapper.kycData.aadhaarPhotoUrl, '_blank')}
                  />
                </div>
              </div>
            )}
            {scrapper.kycData.licenseUrl && (
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: '#718096' }}>{getTranslatedText("Driving License")}</p>
                <div className="border rounded-lg overflow-hidden h-40 bg-gray-50 flex items-center justify-center">
                  <img src={scrapper.kycData.licenseUrl} alt={getTranslatedText("Driving License")} className="max-w-full max-h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(scrapper.kycData.licenseUrl, '_blank')}
                  />
                </div>
              </div>
            )}
            {scrapper.kycData.selfieUrl && (
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: '#718096' }}>{getTranslatedText("Selfie")}</p>
                <div className="border rounded-lg overflow-hidden h-40 bg-gray-50 flex items-center justify-center">
                  <img src={scrapper.kycData.selfieUrl} alt={getTranslatedText("Selfie")} className="max-w-full max-h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(scrapper.kycData.selfieUrl, '_blank')}
                  />
                </div>
              </div>
            )}
            {!scrapper.kycData.aadhaarPhotoUrl && !scrapper.kycData.licenseUrl && !scrapper.kycData.selfieUrl && (
              <p className="text-sm text-gray-500 italic">{getTranslatedText("No documents uploaded.")}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Subscription Information */}
      {scrapper.subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
            {getTranslatedText("Subscription Details")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#718096' }}>{getTranslatedText("Plan")}</p>
              <p className="font-semibold" style={{ color: '#2d3748' }}>{scrapper.subscription.plan}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#718096' }}>{getTranslatedText("Status")}</p>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold inline-block" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
                <FaCheckCircle className="text-xs" />
                {getTranslatedText(scrapper.subscription.status.charAt(0).toUpperCase() + scrapper.subscription.status.slice(1))}
              </span>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#718096' }}>{getTranslatedText("Price")}</p>
              <p className="font-semibold" style={{ color: '#2d3748' }}>₹{scrapper.subscription.price}{getTranslatedText("/month")}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#718096' }}>{getTranslatedText("Expires On")}</p>
              <p className="font-semibold" style={{ color: '#2d3748' }}>
                {new Date(scrapper.subscription.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Order History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
          {getTranslatedText("Completed Orders ({count})", { count: orders.length })}
        </h2>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#718096' }}>
              {getTranslatedText("No completed orders yet")}
            </p>
          ) : (
            orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="p-4 rounded-xl border-2" style={{ borderColor: '#e2e8f0' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold" style={{ color: '#2d3748' }}>{order.orderId || order.id}</span>
                    </div>
                    <div className="space-y-1 text-sm" style={{ color: '#718096' }}>
                      <p>{getTranslatedText("User: ")}{order.userName || getTranslatedText('User')}</p>
                      <p>{getTranslatedText("Categories: ")}{order.categories?.join(', ') || getTranslatedText('N/A')}</p>
                      <p>{getTranslatedText("Weight: ")}{order.weight || getTranslatedText('N/A')}{getTranslatedText(" kg • Amount Paid: ₹")}{order.paidAmount || 0}</p>
                      <p>{getTranslatedText("Location: ")}{order.location || getTranslatedText('N/A')}</p>
                      {order.completedAt && (
                        <p className="text-xs">
                          {getTranslatedText("Completed: ")}{new Date(order.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScrapperDetail;
