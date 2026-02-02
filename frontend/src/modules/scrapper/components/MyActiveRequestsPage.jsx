import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scrapperOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import ScrapperBottomNav from './ScrapperBottomNav';

const MyActiveRequestsPage = () => {
  const staticTexts = [
    "My Active Requests",
    "{count} request in progress",
    "{count} requests in progress",
    "Go Online",
    "No Active Requests",
    "You don't have any active requests at the moment.",
    "Go Online to Receive Requests",
    "Accepted",
    "Picked Up",
    "Payment Pending",
    "Payment Done",
    "Location",
    "Pickup Time",
    "Distance",
    "View Details & Continue",
    "Time not specified",
    "User",
    "Scrap",
    "Address not available",
    "Unknown User",
    "Loading active requests...",
    "Failed to load active requests"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
    const scrapperUser = localStorage.getItem('scrapperUser');
    if (scrapperAuth !== 'true' || !scrapperUser) {
      navigate('/scrapper/login', { replace: true });
      return;
    }
  }, [navigate]);

  // Load active requests
  const mapOrderToRequest = (order) => {
    if (!order) return null;

    const categories = Array.isArray(order.scrapItems)
      ? order.scrapItems.map((item) => item.category).filter(Boolean)
      : [];

    const addressParts = [
      order.pickupAddress?.street,
      order.pickupAddress?.city,
      order.pickupAddress?.state,
      order.pickupAddress?.pincode
    ].filter(Boolean);

    const address = addressParts.join(', ');

    const statusLower = order.status?.toLowerCase();
    const paymentStatusLower = order.paymentStatus?.toLowerCase();

    let uiStatus = 'accepted'; // Default status

    if (statusLower === 'completed') {
      uiStatus = 'completed';
    } else if (statusLower === 'in_progress') {
      if (paymentStatusLower === 'paid' || paymentStatusLower === 'completed') {
        uiStatus = 'payment_done';
      } else {
        uiStatus = 'picked_up';
      }
    }

    const estimatedAmount =
      typeof order.totalAmount === 'number'
        ? `₹${order.totalAmount.toFixed(0)}`
        : order.totalAmount || '₹0';

    return {
      id: order._id,
      orderId: order._id,
      userId: order.user?._id || order.user,
      userName: order.user?.name || getTranslatedText('User'),
      userPhone: order.user?.phone || '',
      scrapType: categories.map(c => getTranslatedText(c)).join(', ') || getTranslatedText('Scrap'),
      weight: order.totalWeight,
      pickupSlot: order.pickupSlot,
      preferredTime: order.preferredTime,
      images: (order.images || []).map((img) => img.url || img.preview || img),
      location: {
        address: address || getTranslatedText('Address not available'),
        lat: order.pickupAddress?.coordinates?.lat || 19.076,
        lng: order.pickupAddress?.coordinates?.lng || 72.8777
      },
      distance: null,
      estimatedEarnings: estimatedAmount,
      status: uiStatus,
      acceptedAt: order.acceptedAt,
      notes: order.notes || ''
    };
  };

  const loadActiveRequests = async () => {
    setError('');
    try {
      // Fetch scrapper's assigned orders from backend
      const response = await scrapperOrdersAPI.getMyAssigned();
      const rawOrders = response?.data?.orders || response?.orders || response || [];

      const mapped = (rawOrders || [])
        .filter(o => {
          const s = o.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        })
        .map(mapOrderToRequest)
        .filter(Boolean);

      // Sort by acceptedAt (newest first)
      mapped.sort((a, b) => {
        const dateA = new Date(a.acceptedAt || a.createdAt || 0);
        const dateB = new Date(b.acceptedAt || b.createdAt || 0);
        return dateB - dateA;
      });

      setActiveRequests(mapped);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load active requests:', err);
      setError(err?.message || getTranslatedText('Failed to load active requests'));
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveRequests();

    // Refresh on focus/visibility
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadActiveRequests();
      }
    };

    const handleFocus = () => {
      loadActiveRequests();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', loadActiveRequests);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', loadActiveRequests);
    };
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      accepted: {
        bg: 'rgba(59, 130, 246, 0.1)',
        color: '#2563eb',
        label: getTranslatedText('Accepted'),
        icon: '✓'
      },
      picked_up: {
        bg: 'rgba(234, 179, 8, 0.1)',
        color: '#ca8a04',
        label: getTranslatedText('Picked Up'),
        icon: '📦'
      },
      payment_pending: {
        bg: 'rgba(249, 115, 22, 0.1)',
        color: '#f97316',
        label: getTranslatedText('Payment Pending'),
        icon: '💰'
      },
      payment_done: {
        bg: 'rgba(34, 197, 94, 0.1)',
        color: '#16a34a',
        label: getTranslatedText('Payment Done'),
        icon: '✓'
      }
    };
    return configs[status] || configs.accepted;
  };

  const formatPickupTime = (request) => {
    if (request.pickupSlot) {
      return `${request.pickupSlot.dayName}, ${request.pickupSlot.date} • ${request.pickupSlot.slot}`;
    }
    if (request.preferredTime) {
      return request.preferredTime;
    }
    return getTranslatedText('Time not specified');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f4fcf6]">
        <p className="text-emerald-800 font-medium">{getTranslatedText("Loading active requests...")}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full pb-20 md:pb-0"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6 border-b border-transparent bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {getTranslatedText("My Active Requests")}
              </h1>
              <p className="text-xs md:text-sm mt-1 text-slate-600">
                {activeRequests.length === 1
                  ? getTranslatedText("{count} request in progress", { count: activeRequests.length })
                  : getTranslatedText("{count} requests in progress", { count: activeRequests.length })}
              </p>
              {error && (
                <p className="text-[11px] md:text-xs mt-1 text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
          {activeRequests.length > 0 && (
            <button
              onClick={() => navigate('/scrapper/active-requests')}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
            >
              {getTranslatedText("Go Online")}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        {activeRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 md:py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800">
              {getTranslatedText("No Active Requests")}
            </h3>
            <p className="text-sm md:text-base mb-6 text-slate-500">
              {getTranslatedText("You don't have any active requests at the moment.")}
            </p>
            <button
              onClick={() => navigate('/scrapper/active-requests')}
              className="px-6 py-3 rounded-full font-semibold text-sm md:text-base transition-all bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
            >
              {getTranslatedText("Go Online to Receive Requests")}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((request, index) => {
              const statusConfig = getStatusConfig(request.status);
              const pickupTime = formatPickupTime(request);

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/scrapper/active-request/${request.id}`, { state: { request } })}
                  className="rounded-2xl p-4 md:p-6 shadow-md cursor-pointer transition-all hover:shadow-xl border bg-white border-slate-200 hover:border-emerald-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* User Avatar */}
                      <div
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600 font-bold text-lg md:text-xl"
                      >
                        {request.userName?.[0]?.toUpperCase() || 'U'}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-bold truncate text-slate-800">
                            {request.userName || getTranslatedText('Unknown User')}
                          </h3>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm md:text-base mb-2 text-slate-500">
                          {getTranslatedText(request.scrapType) || getTranslatedText('Scrap')}
                        </p>
                        <p className="text-lg md:text-xl font-bold text-emerald-600">
                          {request.estimatedEarnings || '₹0'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                    {/* Location */}
                    {request.location?.address && (
                      <div className="flex items-start gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400 mt-0.5 shrink-0">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 mb-0.5">{getTranslatedText("Location")}</p>
                          <p className="text-sm font-medium truncate text-slate-600">
                            {request.location.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pickup Time */}
                    <div className="flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400 mt-0.5 shrink-0">
                        <path d="M8 2v2M16 2v2M5 7h14M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5">{getTranslatedText("Pickup Time")}</p>
                        <p className="text-sm font-medium truncate text-slate-600">
                          {pickupTime}
                        </p>
                      </div>
                    </div>

                    {/* Distance */}
                    {request.distance && (
                      <div className="flex items-start gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400 mt-0.5 shrink-0">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 mb-0.5">{getTranslatedText("Distance")}</p>
                          <p className="text-sm font-medium text-slate-600">
                            {request.distance}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Accepted At */}
                    {request.acceptedAt && (
                      <div className="flex items-start gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400 mt-0.5 shrink-0">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 mb-0.5">{getTranslatedText("Accepted")}</p>
                          <p className="text-sm font-medium text-slate-600">
                            {new Date(request.acceptedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/scrapper/active-request/${request.id}`, { state: { request } });
                      }}
                      className="w-full py-3 rounded-xl font-semibold text-sm md:text-base transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg"
                    >
                      {getTranslatedText("View Details & Continue")}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <div className="md:hidden">
        <ScrapperBottomNav />
      </div>
    </motion.div>
  );
};

export default MyActiveRequestsPage;








