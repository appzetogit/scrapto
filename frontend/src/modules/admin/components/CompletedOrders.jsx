import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSearch, FaDownload, FaCalendarAlt, FaUser, FaTruck, FaRupeeSign, FaEye } from 'react-icons/fa';
import { adminOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const CompletedOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const staticTexts = [
    "Failed to load completed orders",
    "Completed Orders",
    "View all completed pickup orders",
    "Total Revenue: ₹{revenue}",
    "Export CSV",
    "Search by order ID, user, or scrapper...",
    "Loading orders...",
    "No completed orders found",
    "Try adjusting your filters",
    "No orders have been completed yet",
    "Completed",
    "User: {name}",
    "Scrapper: {name}",
    "Items: {items}",
    "Mixed",
    "Weight: {weight} kg",
    "View User",
    "all",
    "today",
    "week",
    "month",
    "All",
    "Today",
    "Week",
    "Month"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = 'status=completed';

      // Apply date filters
      const now = new Date();
      if (filter === 'today') {
        const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query += `&dateFrom=${today}`;
      } else if (filter === 'week') {
        const lastWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query += `&dateFrom=${lastWeek}`;
      } else if (filter === 'month') {
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        query += `&dateFrom=${lastMonth}`;
      }

      const response = await adminOrdersAPI.getAll(query);
      if (response.success && response.data?.orders) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading completed orders:', err);
      setError(getTranslatedText('Failed to load completed orders'));
    } finally {
      setLoading(false);
    }
  };

  // Filter orders locally for search query as backend search might be limited or for immediate UI feedback
  // Backend supports search on name/email/phone, but if we want to search ID/Categories client-side on fetched data:
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const orderId = (order.orderId || order._id || '').toLowerCase();
    const userName = (order.user?.name || '').toLowerCase();
    const scrapperName = (order.scrapper?.name || '').toLowerCase();

    return orderId.includes(q) || userName.includes(q) || scrapperName.includes(q);
  });

  const handleViewDetails = (order) => {
    // Navigate to user detail page to see order details
    if (order.user?._id || order.user) {
      const userId = order.user?._id || order.user;
      navigate(`/admin/users/${userId}`);
    } else {
      console.warn('No user ID found for order:', order);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Order ID', 'User', 'Scrapper', 'Categories', 'Weight (kg)', 'Amount Paid (₹)', 'Location', 'Completed Date'],
      ...filteredOrders.map(order => [
        order.orderId || order._id,
        order.user?.name || 'N/A',
        order.scrapper?.name || 'N/A',
        order.scrapItems?.map(i => i.category).join(', ') || 'N/A',
        order.totalWeight || 'N/A',
        order.totalAmount || 0,
        order.address?.street || 'N/A',
        new Date(order.updatedAt || order.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate total revenue from fetched orders
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

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
              {getTranslatedText("Completed Orders")}
            </h1>
            <p className="text-xs md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("View all completed pickup orders")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("Total Revenue: ₹{revenue}", { revenue: totalRevenue.toLocaleString() })}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
              style={{ backgroundColor: '#64946e', color: '#ffffff' }}
            >
              <FaDownload className="text-xs md:text-sm" />
              <span className="hidden sm:inline">{getTranslatedText("Export CSV")}</span>
              <span className="sm:hidden">{getTranslatedText("Export CSV")}</span>
            </motion.button>
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
              placeholder={getTranslatedText("Search by order ID, user, or scrapper...")}
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
            {['all', 'today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                className={`px-2.5 py-1.5 md:px-4 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all ${filter === period ? 'shadow-md' : ''
                  }`}
                style={{
                  backgroundColor: filter === period ? '#64946e' : '#f7fafc',
                  color: filter === period ? '#ffffff' : '#2d3748'
                }}
              >
                {getTranslatedText(period.charAt(0).toUpperCase() + period.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <AnimatePresence>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }} />
              <p style={{ color: '#718096' }}>{getTranslatedText("Loading orders...")}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <FaCheckCircle className="mx-auto mb-4" style={{ color: '#cbd5e0', fontSize: '48px' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("No completed orders found")}
              </p>
              <p className="text-sm" style={{ color: '#718096' }}>
                {searchQuery || filter !== 'all' ? getTranslatedText('Try adjusting your filters') : getTranslatedText('No orders have been completed yet')}
              </p>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredOrders.length - 1 ? 'border-b' : ''
                  }`}
                style={{ borderColor: '#e2e8f0' }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
                      <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                        #{String(order.orderId || order._id).substring(0, 8).toUpperCase()}
                      </h3>
                      <span className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
                        <FaCheckCircle className="text-xs" />
                        <span className="hidden sm:inline">{getTranslatedText("Completed")}</span>
                        <span className="sm:hidden">{getTranslatedText("Completed").charAt(0)}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-3 text-xs md:text-sm" style={{ color: '#718096' }}>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <FaUser className="text-xs" />
                        <span className="truncate">{getTranslatedText("User: {name}", { name: order.user?.name || 'N/A' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <FaTruck className="text-xs" />
                        <span className="truncate">{getTranslatedText("Scrapper: {name}", { name: order.scrapper?.name || 'N/A' })}</span>
                      </div>
                      <div>
                        {getTranslatedText("Items: {items}", { items: order.scrapItems?.map(i => i.category).join(', ') || getTranslatedText('Mixed') })}
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <FaRupeeSign className="text-xs" />
                        <span className="font-semibold" style={{ color: '#2d3748' }}>
                          ₹{order.totalAmount || 0}
                        </span>
                      </div>
                      <div>
                        {getTranslatedText("Weight: {weight} kg", { weight: order.totalWeight || order.scrapItems?.reduce((sum, i) => sum + i.weight, 0) || 0 })}
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <FaCalendarAlt className="text-xs" />
                        <span className="text-xs">
                          {new Date(order.updatedAt || order.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewDetails(order)}
                      className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                      style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                    >
                      <FaEye className="text-xs md:text-sm" />
                      <span className="hidden sm:inline">{getTranslatedText("View User")}</span>
                    </motion.button>
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

export default CompletedOrders;
