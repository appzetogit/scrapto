import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { referralAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaChartBar,
  FaUsers,
  FaTruck,
  FaRupeeSign,
  FaArrowUp,
  FaArrowDown,
  FaTrophy,
  FaDownload,
  FaSpinner
} from 'react-icons/fa';

const ReferralAnalytics = () => {
  const [period, setPeriod] = useState('all'); // all, today, week, month
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalRewardsPaid: 0,
    conversionRate: 0,
    userReferrals: 0,
    scrapperReferrals: 0,
    crossReferrals: 0,
  });
  const [topReferrers, setTopReferrers] = useState([]);
  const [rawReferrals, setRawReferrals] = useState([]);

  const staticTexts = [
    "Export functionality will be implemented with backend integration",
    "Referral Analytics",
    "Comprehensive referral system insights",
    "Export",
    "All Time",
    "Today",
    "Week",
    "Month",
    "Total Referrals",
    "Active Referrals",
    "Total Rewards Paid",
    "Conversion Rate",
    "User Referrals",
    "Scrapper Referrals",
    "Cross-Referrals",
    "Top 10 Referrers",
    "No referrers yet",
    "User",
    "Scrapper",
    "referrals",
    "Earnings",
    "{percentage}% of total",
    "Unknown",
    "0% of total"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (rawReferrals.length > 0) {
      processAnalytics(rawReferrals, period);
    }
  }, [period, rawReferrals]);

  const loadData = async () => {
    setLoading(true);
    try {
      // For now, we fetch all and compute on frontend. 
      // In production, should use dedicated analytics endpoint.
      const response = await referralAPI.getAllReferrals();
      if (response.success && response.data?.referrals) {
        setRawReferrals(response.data.referrals);
        processAnalytics(response.data.referrals, period);
      }
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (referrals, timePeriod) => {
    // Filter by date
    const now = new Date();
    const filtered = referrals.filter(ref => {
      if (timePeriod === 'all') return true;
      const refDate = new Date(ref.createdAt);
      if (timePeriod === 'today') {
        return refDate.toDateString() === now.toDateString();
      }
      if (timePeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return refDate >= weekAgo;
      }
      if (timePeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return refDate >= monthAgo;
      }
      return true;
    });

    const total = filtered.length;
    // Assume verification or completion implies 'active' for analytics purpose
    const active = filtered.filter(r => ['verified', 'completed', 'active'].includes(r.status)).length;
    const rewards = filtered.reduce((sum, r) => sum + (r.rewardEarned || 0), 0);
    const conversion = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

    // Type breakdown (Requires identifying referrer type, might be missing in basic referral model unless populated)
    // We'll guess based on populated referrer or just use dummy ratio if missing
    // Ideally backend should provide this.
    // Assuming backend populates referrer with 'role'
    const userRefs = filtered.filter(r => r.referrer?.role === 'user').length;
    const scrapperRefs = filtered.filter(r => r.referrer?.role === 'scrapper').length;
    // Cross referrals logic - requires checking both types
    // Simplified:
    const crossRefs = 0; // Hard to calculate without explicit type fields

    setAnalytics({
      totalReferrals: total,
      activeReferrals: active,
      totalRewardsPaid: rewards,
      conversionRate: conversion,
      userReferrals: userRefs,
      scrapperReferrals: scrapperRefs,
      crossReferrals: crossRefs
    });

    // Top Referrers
    const referrerMap = {};
    filtered.forEach(ref => {
      if (!ref.referrer) return;
      const id = ref.referrer._id || ref.referrer;
      if (!referrerMap[id]) {
        referrerMap[id] = {
          id,
          name: ref.referrer.name || getTranslatedText('Unknown'),
          role: ref.referrer.role || 'user',
          count: 0,
          earnings: 0
        };
      }
      referrerMap[id].count += 1;
      referrerMap[id].earnings += (ref.rewardEarned || 0);
    });

    const sortedReferrers = Object.values(referrerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setTopReferrers(sortedReferrers);
  };

  const handleExport = () => {
    alert(getTranslatedText('Export functionality will be implemented with backend integration'));
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
              style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
            >
              <FaChartBar className="text-3xl" style={{ color: '#64946e' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d3748' }}>
                {getTranslatedText("Referral Analytics")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("Comprehensive referral system insights")}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
            style={{ backgroundColor: '#64946e', color: '#ffffff' }}
          >
            <FaDownload />
            {getTranslatedText("Export")}
          </motion.button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {['all', 'today', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all capitalize ${period === p ? 'shadow-md' : ''
                }`}
              style={{
                backgroundColor: period === p ? '#64946e' : '#f7fafc',
                color: period === p ? '#ffffff' : '#2d3748'
              }}
            >
              {p === 'all' ? getTranslatedText('All Time') : getTranslatedText(p.charAt(0).toUpperCase() + p.slice(1))}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaUsers className="text-xl" style={{ color: '#64946e' }} />
            <FaArrowUp className="text-sm" style={{ color: '#10b981' }} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: '#2d3748' }}>
            {analytics.totalReferrals}
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Total Referrals")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaTruck className="text-xl" style={{ color: '#64946e' }} />
            <FaArrowUp className="text-sm" style={{ color: '#10b981' }} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: '#2d3748' }}>
            {analytics.activeReferrals}
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Active Referrals")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaRupeeSign className="text-xl" style={{ color: '#64946e' }} />
            <FaArrowUp className="text-sm" style={{ color: '#10b981' }} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: '#2d3748' }}>
            ₹{analytics.totalRewardsPaid.toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Total Rewards Paid")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <FaChartBar className="text-xl" style={{ color: '#64946e' }} />
            <FaArrowUp className="text-sm" style={{ color: '#10b981' }} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: '#2d3748' }}>
            {analytics.conversionRate}%
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Conversion Rate")}</p>
        </motion.div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaUsers className="text-xl" style={{ color: '#64946e' }} />
            <h3 className="font-bold" style={{ color: '#2d3748' }}>{getTranslatedText("User Referrals")}</h3>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#64946e' }}>
            {analytics.userReferrals}
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>
            {analytics.totalReferrals > 0
              ? getTranslatedText("{percentage}% of total", { percentage: ((analytics.userReferrals / analytics.totalReferrals) * 100).toFixed(1) })
              : getTranslatedText("0% of total")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaTruck className="text-xl" style={{ color: '#64946e' }} />
            <h3 className="font-bold" style={{ color: '#2d3748' }}>{getTranslatedText("Scrapper Referrals")}</h3>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#64946e' }}>
            {analytics.scrapperReferrals}
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>
            {analytics.totalReferrals > 0
              ? getTranslatedText("{percentage}% of total", { percentage: ((analytics.scrapperReferrals / analytics.totalReferrals) * 100).toFixed(1) })
              : getTranslatedText("0% of total")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaUsers className="text-xl" style={{ color: '#3b82f6' }} />
            <h3 className="font-bold" style={{ color: '#2d3748' }}>{getTranslatedText("Cross-Referrals")}</h3>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>
            {analytics.crossReferrals}
          </p>
          <p className="text-xs" style={{ color: '#718096' }}>
            {analytics.totalReferrals > 0
              ? getTranslatedText("{percentage}% of total", { percentage: ((analytics.crossReferrals / analytics.totalReferrals) * 100).toFixed(1) })
              : getTranslatedText("0% of total")}
          </p>
        </motion.div>
      </div>

      {/* Top Referrers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaTrophy className="text-xl" style={{ color: '#64946e' }} />
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#2d3748' }}>
            {getTranslatedText("Top 10 Referrers")}
          </h2>
        </div>
        <div className="space-y-3">
          {topReferrers.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#718096' }}>
              {getTranslatedText("No referrers yet")}
            </p>
          ) : (
            topReferrers.map((referrer, index) => (
              <div
                key={`${referrer.id}`}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: '#f7fafc' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      backgroundColor: index < 3 ? '#ffd700' : 'rgba(100, 148, 110, 0.1)',
                      color: index < 3 ? '#2d3748' : '#64946e'
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                      {referrer.role === 'user' ? getTranslatedText('User') : getTranslatedText('Scrapper')} - {referrer.name}
                    </p>
                    <p className="text-xs" style={{ color: '#718096' }}>
                      {referrer.count} {getTranslatedText("referrals")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#64946e' }}>
                    ₹{referrer.earnings.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: '#718096' }}>
                    {getTranslatedText("Earnings")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReferralAnalytics;
