import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  FaChartBar, FaDownload, FaCalendarAlt, FaRupeeSign, FaUsers,
  FaTruck, FaFileInvoice, FaCheckCircle, FaCreditCard,
  FaSpinner
} from 'react-icons/fa';
import { adminAPI, adminOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month'); // today, week, month, year

  const staticTexts = [
    "Failed to export report",
    "Total Users",
    "Total Scrappers",
    "Total Orders",
    "Completed Orders",
    "Total Revenue",
    "Daily Revenue",
    "Reports & Analytics",
    "View platform statistics and generate reports",
    "Today",
    "This Week",
    "This Month",
    "This Year",
    "Export Reports",
    "Users Report",
    "Scrappers Report",
    "Orders Report",
    "Revenue Report",
    "Revenue Trends ({range})",
    "No revenue data for this period",
    "Try adjusting your filters"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Calculate start/end dates based on range
      const end = new Date();
      const start = new Date();

      switch (dateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(end.getDate() - 7);
          break;
        case 'month':
          start.setMonth(end.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(end.getFullYear() - 1);
          break;
        default:
          start.setMonth(end.getMonth() - 1);
      }

      const [dashboardRes, revenueRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPaymentAnalytics(
          `startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        )
      ]);

      if (dashboardRes.success && dashboardRes.data?.stats) {
        setStats(dashboardRes.data.stats);
      }

      if (revenueRes.success && revenueRes.data) {
        setRevenueStats(revenueRes.data);
      }

    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type) => {
    if (exportLoading) return;
    setExportLoading(true);

    try {
      let csvContent = '';
      let filename = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;

      if (type === 'users') {
        const res = await adminAPI.getAllUsers('limit=1000'); // Fetch reasonably large batch
        const users = res.data?.users || [];

        const headers = ['User ID', 'Name', 'Phone', 'Email', 'Active', 'Joined Date', 'Total Orders'];
        const rows = users.map(u => [
          u._id,
          `"${u.name}"`,
          u.phone,
          u.email,
          u.isActive ? 'Yes' : 'No',
          new Date(u.createdAt).toLocaleDateString(),
          u.totalOrders || 0
        ]);

        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }
      else if (type === 'scrappers') {
        const res = await adminAPI.getAllScrappers('limit=1000');
        const scrappers = res.data?.scrappers || [];

        const headers = ['Scrapper ID', 'Name', 'Phone', 'Status', 'KYC Status', 'Total Pickups', 'Rating'];
        const rows = scrappers.map(s => [
          s._id,
          `"${s.name}"`,
          s.phone,
          s.status,
          s.kyc?.status || 'N/A',
          s.totalPickups || 0,
          s.rating || 0
        ]);

        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }
      else if (type === 'orders') {
        const res = await adminOrdersAPI.getAll('limit=1000');
        const orders = res.data?.orders || [];

        const headers = ['Order ID', 'User', 'Scrapper', 'Status', 'Amount', 'Weight', 'Date'];
        const rows = orders.map(o => [
          o.orderId || o._id,
          `"${o.user?.name || 'N/A'}"`,
          `"${o.scrapper?.name || 'N/A'}"`,
          o.status,
          o.totalAmount || 0,
          o.totalWeight || 0,
          new Date(o.createdAt).toLocaleDateString()
        ]);

        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }
      else if (type === 'revenue') {
        // Use revenue stats or fetch payments
        // We'll use the dailyRevenue from revenueStats if available, essentially exporting the chart data
        if (revenueStats?.dailyRevenue) {
          const headers = ['Date', 'Total Revenue', 'Transaction Count'];
          const rows = revenueStats.dailyRevenue.map(d => [
            d._id,
            d.total,
            d.count
          ]);
          csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        } else {
          csvContent = 'Date,Total Revenue,Count\nNo Data';
        }
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export failed:', err);
      alert(getTranslatedText('Failed to export report'));
    } finally {
      setExportLoading(false);
    }
  };

  const statsCards = [
    {
      title: getTranslatedText('Total Users'),
      value: stats?.users?.total || 0,
      icon: FaUsers,
      color: '#3b82f6',
      bg: '#dbeafe'
    },
    {
      title: getTranslatedText('Total Scrappers'),
      value: stats?.scrappers?.total || 0,
      icon: FaTruck,
      color: '#10b981',
      bg: '#d1fae5'
    },
    {
      title: getTranslatedText('Total Orders'),
      value: stats?.orders?.total || 0,
      icon: FaFileInvoice,
      color: '#f59e0b',
      bg: '#fef3c7'
    },
    {
      title: getTranslatedText('Completed Orders'),
      value: stats?.orders?.completed || 0,
      icon: FaCheckCircle,
      color: '#8b5cf6',
      bg: '#ede9fe'
    },
    {
      title: getTranslatedText('Total Revenue'),
      value: `₹${((revenueStats?.totalRevenue || 0) / 1000).toFixed(1)}k`,
      icon: FaRupeeSign,
      color: '#06b6d4',
      bg: '#cffafe'
    },
    {
      title: getTranslatedText('Daily Revenue'), // Using dashboard specific stat or derived
      value: `₹${stats?.payments?.todayRevenue || 0}`,
      icon: FaCreditCard,
      color: '#ef4444',
      bg: '#fee2e2'
    }
  ];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <FaSpinner className="animate-spin text-3xl" style={{ color: '#64946e' }} />
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div>
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Reports & Analytics")}
            </h1>
            <p className="text-xs md:text-sm lg:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("View platform statistics and generate reports")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2"
              style={{
                borderColor: '#e2e8f0',
                focusBorderColor: '#64946e'
              }}
            >
              <option value="today">{getTranslatedText("Today")}</option>
              <option value="week">{getTranslatedText("This Week")}</option>
              <option value="month">{getTranslatedText("This Month")}</option>
              <option value="year">{getTranslatedText("This Year")}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div
                  className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <Icon style={{ color: card.color, fontSize: '16px' }} className="md:text-2xl" />
                </div>
              </div>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-0.5 md:mb-1" style={{ color: '#2d3748' }}>
                {card.value}
              </h3>
              <p className="text-[10px] md:text-sm lg:text-base leading-tight" style={{ color: '#718096' }}>
                {card.title}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Export Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
          {getTranslatedText("Export Reports")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: getTranslatedText('Users Report'), type: 'users', icon: FaUsers },
            { label: getTranslatedText('Scrappers Report'), type: 'scrappers', icon: FaTruck },
            { label: getTranslatedText('Orders Report'), type: 'orders', icon: FaFileInvoice },
            { label: getTranslatedText('Revenue Report'), type: 'revenue', icon: FaRupeeSign }
          ].map((report, index) => {
            const Icon = report.icon;
            return (
              <motion.button
                key={report.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExportReport(report.type)}
                disabled={exportLoading}
                className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                style={{ backgroundColor: '#f7fafc' }}
              >
                {exportLoading ? (
                  <FaSpinner className="animate-spin text-2xl" style={{ color: '#64946e' }} />
                ) : (
                  <Icon style={{ color: '#64946e', fontSize: '24px' }} />
                )}
                <span className="text-sm font-medium" style={{ color: '#2d3748' }}>
                  {report.label}
                </span>
                <FaDownload className="text-xs" style={{ color: '#718096' }} />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
          {getTranslatedText("Revenue Trends ({range})", { range: getTranslatedText(dateRange.charAt(0).toUpperCase() + dateRange.slice(1)) })}
        </h2>
        <div className="h-64 flex items-end justify-center gap-2 md:gap-4 p-4" style={{ backgroundColor: '#f7fafc', borderRadius: '12px' }}>
          {/* Simple CSS Bar Chart for visualization */}
          {revenueStats?.dailyRevenue?.length > 0 ? (
            revenueStats.dailyRevenue.slice(-10).map((day, idx) => {
              const maxVal = Math.max(...revenueStats.dailyRevenue.map(d => d.total));
              const heightPct = maxVal > 0 ? (day.total / maxVal) * 100 : 0;
              return (
                <div key={day._id} className="flex flex-col items-center gap-1 group w-12 cursor-pointer">
                  <div className="relative w-full bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-200" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                      ₹{day.total}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap rotate-45 origin-left md:rotate-0 translate-y-2 md:translate-y-0">
                    {new Date(day._id).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400">{getTranslatedText("No revenue data for this period")}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
