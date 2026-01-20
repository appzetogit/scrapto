import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCreditCard, FaSearch, FaCheckCircle, FaTimesCircle, FaClock,
  FaEye, FaCalendarAlt, FaRupeeSign, FaUser
} from 'react-icons/fa';

import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const SubscriptionsList = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired, cancelled
  const [searchQuery, setSearchQuery] = useState('');

  const staticTexts = [
    "Unknown Scrapper",
    "N/A",
    "Unknown Plan",
    "Subscription Details:\n\nScrapper: {scrapper}\nPlan: {plan}\nPrice: ₹{price}/month\nStatus: {status}",
    "Subscription extended by {count} days",
    "Active",
    "Expired",
    "Cancelled",
    "Pending",
    "Expired on {date}",
    "{count} days left",
    "Subscription Management",
    "Manage all scrapper subscriptions",
    "Monthly Revenue: ₹{amount}",
    "Search by scrapper name, phone, or plan...",
    "All",
    "Loading subscriptions...",
    "No subscriptions found",
    "Try a different search term",
    "View",
    "Extend"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllSubscriptions();
      if (response.success && response.data?.subscriptions) {
        const mappedSubscriptions = response.data.subscriptions.map((item, index) => {
          const sub = item.subscription;
          const user = item.scrapper;
          const plan = sub.planId || {}; // populated plan details

          return {
            id: sub._id || `sub_${index}`,
            scrapperId: user.id || user._id,
            scrapperName: user.name || getTranslatedText('Unknown Scrapper'),
            scrapperPhone: user.phone || getTranslatedText('N/A'),
            planId: plan._id || plan.id || 'unknown',
            planName: plan.name || getTranslatedText('Unknown Plan'),
            price: plan.price || 0,
            status: sub.status || 'inactive',
            subscribedAt: sub.startDate || sub.createdAt,
            expiryDate: sub.expiryDate,
            cancelledAt: sub.cancelledAt
          };
        });
        setSubscriptions(mappedSubscriptions);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      // Fallback to empty list or handle error UI
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch =
      sub.scrapperName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.scrapperPhone.includes(searchQuery) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewDetails = (sub) => {
    // Navigate to scrapper detail page
    if (sub.scrapperId) {
      navigate(`/admin/scrappers/${sub.scrapperId}`);
    } else {
      alert(getTranslatedText("Subscription Details:\n\nScrapper: {scrapper}\nPlan: {plan}\nPrice: ₹{price}/month\nStatus: {status}", {
        scrapper: sub.scrapperName,
        plan: sub.planName,
        price: sub.price,
        status: sub.status
      }));
    }
  };

  const handleExtendSubscription = (subId, days = 30) => {
    const updatedSubs = subscriptions.map(sub => {
      if (sub.id === subId) {
        const currentExpiry = new Date(sub.expiryDate);
        const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
        return {
          ...sub,
          expiryDate: newExpiry.toISOString(),
          status: 'active'
        };
      }
      return sub;
    });
    setSubscriptions(updatedSubs);
    alert(getTranslatedText("Subscription extended by {count} days", { count: days }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#d1fae5', color: '#10b981', icon: FaCheckCircle, label: getTranslatedText('Active') },
      expired: { bg: '#fee2e2', color: '#dc2626', icon: FaTimesCircle, label: getTranslatedText('Expired') },
      cancelled: { bg: '#fee2e2', color: '#dc2626', icon: FaTimesCircle, label: getTranslatedText('Cancelled') },
      pending: { bg: '#fef3c7', color: '#f59e0b', icon: FaClock, label: getTranslatedText('Pending') }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span
        className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <Icon className="text-xs" />
        <span className="hidden sm:inline">{style.label}</span>
        <span className="sm:hidden">{style.label.charAt(0)}</span>
      </span>
    );
  };

  const getDaysRemaining = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffMs = expiry - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalRevenue = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.price, 0);

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
              {getTranslatedText("Subscription Management")}
            </h1>
            <p className="text-xs md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Manage all scrapper subscriptions")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("Monthly Revenue: ₹{amount}", { amount: totalRevenue })}
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
              placeholder={getTranslatedText("Search by scrapper name, phone, or plan...")}
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
            {['all', 'active', 'expired', 'cancelled'].map((status) => (
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
                {status === 'all' ? getTranslatedText('All') : getTranslatedText(status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Subscriptions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <AnimatePresence>
          {loading ? (
            <div className="p-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-full border-2 border-t-transparent mx-auto mb-4"
                style={{ borderColor: '#64946e' }}
              />
              <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("Loading subscriptions...")}
              </p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <FaCreditCard className="mx-auto mb-4" style={{ color: '#cbd5e0', fontSize: '48px' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("No subscriptions found")}
              </p>
              <p className="text-sm" style={{ color: '#718096' }}>
                {searchQuery ? getTranslatedText('Try a different search term') : getTranslatedText('No subscriptions found')}
              </p>
            </motion.div>
          ) : (
            filteredSubscriptions.map((sub, index) => {
              const daysRemaining = getDaysRemaining(sub.expiryDate);
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredSubscriptions.length - 1 ? 'border-b' : ''
                    }`}
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    {/* Subscription Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
                        <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                          {sub.scrapperName}
                        </h3>
                        {getStatusBadge(sub.status)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-3 text-xs md:text-sm" style={{ color: '#718096' }}>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <FaUser className="text-xs" />
                          <span className="truncate">{sub.scrapperPhone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <FaCreditCard className="text-xs" />
                          <span className="font-semibold" style={{ color: '#2d3748' }}>{sub.planName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <FaRupeeSign className="text-xs" />
                          <span>₹{sub.price}/month</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <FaCalendarAlt className="text-xs" />
                          <span className="text-xs">
                            {sub.status === 'active'
                              ? `${daysRemaining > 0 ? getTranslatedText("{count} days left", { count: daysRemaining }) : getTranslatedText('Expired')}`
                              : getTranslatedText("Expired on {date}", { date: new Date(sub.expiryDate).toLocaleDateString() })
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(sub)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      >
                        <FaEye className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("View")}</span>
                      </motion.button>
                      {sub.status === 'active' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExtendSubscription(sub.id, 30)}
                          className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all"
                          style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                        >
                          {getTranslatedText("Extend")}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SubscriptionsList;
