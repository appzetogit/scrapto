import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileInvoice, FaSearch, FaClock, FaCheckCircle, FaTimesCircle,
  FaMapMarkerAlt, FaUser, FaTruck, FaEye, FaBan
} from 'react-icons/fa';
import { adminOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ActiveRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, in_progress, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const staticTexts = [
    "Failed to load requests",
    "User",
    "Address not available",
    "Pending",
    "Accepted",
    "In Progress",
    "Completed",
    "Cancelled",
    "{count} min ago",
    "{count} hour ago",
    "{count} hours ago",
    "{count} day ago",
    "{count} days ago",
    "Active Requests",
    "Monitor and manage all pickup requests",
    "{count} Total Requests",
    "Loading requests from server...",
    "Search by request ID, user name, or phone...",
    "all",
    "pending",
    "accepted",
    "in_progress",
    "No requests found",
    "Try a different search term",
    "No active requests at the moment",
    "Categories: {cats}",
    "Weight: {weight} kg",
    "Estimated: ₹{price}",
    "Assignment: {status}",
    "Unassigned",
    "Admin Assigned",
    "Created: {time}",
    "Assigned Scrapper: {name}",
    "View",
    "Assign",
    "Cancel",
    "Are you sure you want to cancel this request?",
    "Assign to scrapper (enter scrapper ID):",
    "Failed to assign order",
    "Failed to cancel order",
    "Request Details:\n\nRequest ID: {id}\nUser: {user}\nStatus: {status}\nWeight: {weight} kg\nEstimated Price: ₹{price}"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadRequests();
  }, []);

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

    // Map backend order status to UI status keys used in filters/badges
    let uiStatus = 'pending';
    if (order.status === 'COMPLETED') {
      uiStatus = 'completed';
    } else if (order.status === 'IN_PROGRESS') {
      uiStatus = 'in_progress';
    } else if (order.assignmentStatus === 'accepted' || order.scrapper) {
      uiStatus = 'accepted';
    }

    const estimatedPrice =
      typeof order.totalAmount === 'number'
        ? order.totalAmount
        : Number(order.totalAmount) || 0;

    return {
      id: order._id,
      requestId: order._id,
      userId: order.user?._id || order.user,
      userName: order.user?.name || 'User',
      userPhone: order.user?.phone || '',
      categories,
      weight: order.totalWeight,
      estimatedPrice,
      status: uiStatus,
      location: {
        address: address || getTranslatedText('Address not available'),
        lat: order.pickupAddress?.coordinates?.lat || 19.076,
        lng: order.pickupAddress?.coordinates?.lng || 72.8777
      },
      images: (order.images || []).map((img) => img.url || img.preview || img),
      createdAt: order.createdAt,
      assignmentStatus: order.assignmentStatus || 'unassigned',
      assignedScrapperId: order.scrapper?._id || order.scrapper || null,
      assignedScrapperName: order.scrapper?.name || null
    };
  };

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // Load orders from admin orders API
      const response = await adminOrdersAPI.getAll();
      const rawOrders = response?.data?.orders || response?.orders || response || [];

      const mapped = (rawOrders || []).map(mapOrderToRequest).filter(Boolean);
      setRequests(mapped);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load admin active requests:', err);
      setError(err?.message || getTranslatedText('Failed to load requests'));
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch =
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userPhone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const handleViewDetails = (request) => {
    // Navigate to user detail page to see request details
    if (request.userId) {
      navigate(`/admin/users/${request.userId}`);
    } else {
      // Show alert with request details if no userId
      alert(getTranslatedText("Request Details:\n\nRequest ID: {id}\nUser: {user}\nStatus: {status}\nWeight: {weight} kg\nEstimated Price: ₹{price}", {
        id: request.requestId,
        user: request.userName,
        status: getTranslatedText(request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')),
        weight: request.weight,
        price: request.estimatedPrice
      }));
    }
  };

  const handleAssignRequest = async (request) => {
    const scrapperId = window.prompt(getTranslatedText('Assign to scrapper (enter scrapper ID):'));
    if (!scrapperId) return;

    try {
      await adminOrdersAPI.assign(request.id, scrapperId);
      await loadRequests();
    } catch (err) {
      console.error('Failed to assign order:', err);
      alert(err?.message || getTranslatedText('Failed to assign order'));
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm(getTranslatedText('Are you sure you want to cancel this request?'))) return;

    try {
      await adminOrdersAPI.cancel(requestId, 'Cancelled by admin');
      await loadRequests();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert(err?.message || getTranslatedText('Failed to cancel order'));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#dbeafe', color: '#3b82f6', icon: FaClock, label: 'Pending' },
      accepted: { bg: '#fef3c7', color: '#f59e0b', icon: FaCheckCircle, label: 'Accepted' },
      in_progress: { bg: '#d1fae5', color: '#10b981', icon: FaTruck, label: 'In Progress' },
      completed: { bg: '#d1fae5', color: '#10b981', icon: FaCheckCircle, label: 'Completed' },
      cancelled: { bg: '#fee2e2', color: '#dc2626', icon: FaTimesCircle, label: 'Cancelled' }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span
        className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <Icon className="text-xs" />
        <span className="hidden sm:inline">{getTranslatedText(style.label)}</span>
        <span className="sm:hidden">{getTranslatedText(style.label).charAt(0)}</span>
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
              {getTranslatedText("Active Requests")}
            </h1>
            <p className="text-xs md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Monitor and manage all pickup requests")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("{count} Total Requests", { count: requests.length })}
              </span>
            </div>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}
        {loading && !error && (
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#718096' }}>
            {getTranslatedText("Loading requests from server...")}
          </p>
        )}
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
              placeholder={getTranslatedText("Search by request ID, user name, or phone...")}
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
            {['all', 'pending', 'accepted', 'in_progress'].map((status) => (
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
                {status === 'all' ? getTranslatedText('all') : getTranslatedText(status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1))}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <AnimatePresence>
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <FaFileInvoice className="mx-auto mb-4" style={{ color: '#cbd5e0', fontSize: '48px' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("No requests found")}
              </p>
              <p className="text-sm" style={{ color: '#718096' }}>
                {searchQuery ? getTranslatedText('Try a different search term') : getTranslatedText('No active requests at the moment')}
              </p>
            </motion.div>
          ) : (
            filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredRequests.length - 1 ? 'border-b' : ''
                  }`}
                style={{ borderColor: '#e2e8f0' }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  {/* Request Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
                      <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                        {request.requestId}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-3 text-xs md:text-sm" style={{ color: '#718096' }}>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <FaUser className="text-xs" />
                        <span className="truncate">{request.userName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <FaMapMarkerAlt className="text-xs" />
                        <span className="truncate">{request.location?.address || 'N/A'}</span>
                      </div>
                      <div>
                        {getTranslatedText("Categories: {cats}", { cats: request.categories?.join(', ') || 'N/A' })}
                      </div>
                      <div>
                        {getTranslatedText("Weight: {weight} kg", { weight: request.weight })}
                      </div>
                      <div>
                        {getTranslatedText("Estimated: ₹{price}", { price: request.estimatedPrice })}
                      </div>
                      {request.assignmentStatus && (
                        <div>
                          {getTranslatedText("Assignment: {status}", {
                            status: request.assignmentStatus === 'unassigned'
                              ? getTranslatedText('Unassigned')
                              : request.assignmentStatus === 'admin_assigned'
                                ? getTranslatedText('Admin Assigned')
                                : request.assignmentStatus
                          })}
                        </div>
                      )}
                      <div className="text-xs">
                        {getTranslatedText("Created: {time}", { time: getTimeAgo(request.createdAt) })}
                      </div>
                    </div>
                    {request.assignedScrapperName && (
                      <div className="mt-1 md:mt-2 text-xs md:text-sm" style={{ color: '#718096' }}>
                        {getTranslatedText("Assigned Scrapper: {name}", { name: request.assignedScrapperName })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewDetails(request)}
                      className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                      style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                    >
                      <FaEye className="text-xs md:text-sm" />
                      <span className="hidden sm:inline">{getTranslatedText("View")}</span>
                    </motion.button>
                    {(!request.assignmentStatus || request.assignmentStatus === 'unassigned') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAssignRequest(request)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
                      >
                        <FaTruck className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("Assign")}</span>
                      </motion.button>
                    )}
                    {request.status !== 'completed' && request.status !== 'cancelled' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                      >
                        <FaBan className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("Cancel")}</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ActiveRequests;

