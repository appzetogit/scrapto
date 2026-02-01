import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { walletService } from '../../shared/services/wallet.service';
import { orderAPI } from '../../shared/utils/api';
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import ReferAndEarn from './ReferAndEarn';
import UserBottomNav from './UserBottomNav';
import {
  FaCheckCircle,
  FaBox,
  FaWallet,
  FaCheck,
  FaWeight,
  FaStar,
  FaTrophy,
  FaChartLine,
  FaEdit,

  FaUser,
  FaPhone,
  FaSignOutAlt,
  FaGift,
  FaCommentAlt,
  FaBell,
  FaQuestionCircle,
  FaCog
} from 'react-icons/fa';
import {
  HiTrendingUp,
  HiCollection,
  HiCash,
  HiLocationMarker
} from 'react-icons/hi';
import {
  MdCategory,
  MdPayment,
  MdCheckCircleOutline,
  MdAssignment
} from 'react-icons/md';

const MyProfilePage = () => {
  // ... existing code ...
  const staticTexts = [
    "My Profile",
    "Verified",
    "Full Name",
    "Phone Number",
    "Cancel",
    "Save Changes",
    "Overview",
    "Activity",
    "Analysis",
    "Refer & Earn",
    "Quick Stats",
    "Total Requests",
    "Completed",
    "Total Earnings",
    "Total Weight",
    "kg",
    "Avg Rating",
    "Top Category",
    "Wallet Balance",
    "View All",
    "Available balance",
    "Pickup Completed",
    "Metal scrap pickup completed successfully",
    "New Request Created",
    "Plastic scrap pickup requested",
    "Payment Received",
    "Amount credited to wallet",
    "Request Accepted",
    "Scrapper accepted your pickup request",
    "Electronics scrap pickup completed",
    "Monthly Requests & Earnings",
    "Requests",
    "Earnings",
    "Category Distribution",
    "No activity yet.",
    "Start by creating a new pickup request!",
    "Go back",
    "User Name",
    "+91 98765 43210",
    "Metal",
    "Plastic",
    "Electronics",
    "Paper",
    "Saved Addresses",
    "Manage pickup locations",
    "My Requests",
    "View pickup history & status",
    "Chat",
    "Messages with scrappers",
    "Notifications",
    "Manage notification settings",
    "Help & Support",
    "FAQ, contact support",
    "Settings",
    "Terms & Conditions",
    "Quick Actions"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // overview, activity, analysis
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || getTranslatedText("User Name"),
    phone: user?.phone || getTranslatedText("+91 98765 43210"),
    profilePicture: null,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'User Name',
        phone: user.phone || '+91 98765 43210',
        profilePicture: null,
      });

      const fetchData = async () => {
        setLoadingActivity(true);
        try {
          // 1. Fetch Wallet Profile (Balance + Transactions)
          const walletData = await walletService.getWalletProfile();
          if (walletData.success && walletData.data) {
            setWalletBalance(walletData.data.balance || 0);
          }

          const transactions = walletData.data?.transactions || [];

          // 2. Fetch Orders (Requests)
          const ordersRes = await orderAPI.getMy();
          const orders = ordersRes.success && ordersRes.data?.orders ? ordersRes.data.orders : [];

          // 3. Calculate Stats
          const completedOrders = orders.filter(o => o.status === 'completed');
          const cancelledOrders = orders.filter(o => o.status === 'cancelled');

          const calculatedTotalWeight = completedOrders.reduce((sum, o) => sum + (o.totalWeight || 0), 0);

          // Calculate Total Earnings (Sum of CREDIT transactions)
          const calculatedTotalEarnings = transactions
            .filter(tx => tx.type === 'CREDIT')
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);

          // Find Favorite Category
          const categoryCount = {};
          completedOrders.forEach(order => {
            if (order.scrapItems) {
              order.scrapItems.forEach(item => {
                const cat = item.category || 'Other';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
              });
            }
          });

          let favCategory = "-";
          let maxCount = 0;
          Object.entries(categoryCount).forEach(([cat, count]) => {
            if (count > maxCount) {
              maxCount = count;
              favCategory = cat;
            }
          });

          setStats({
            totalRequests: orders.length,
            completedRequests: completedOrders.length,
            totalEarnings: calculatedTotalEarnings,
            averageRating: user?.rating || 5.0,
            totalWeight: calculatedTotalWeight,
            favoriteCategory: favCategory !== "-" ? favCategory.charAt(0).toUpperCase() + favCategory.slice(1) : "-"
          });

          // 4. Transform and Merge for Activity Feed
          const mappedTransactions = transactions.map(tx => ({
            id: tx._id || tx.trxId,
            type: 'transaction',
            title: tx.type === 'CREDIT' ? getTranslatedText("Payment Received") : getTranslatedText("Payment Sent"),
            description: tx.description || getTranslatedText(tx.category),
            amount: `₹${tx.amount}`,
            timestamp: new Date(tx.createdAt),
            displayTime: new Date(tx.createdAt).toLocaleDateString(),
            icon: tx.type === 'CREDIT' ? FaWallet : FaCheckCircle,
            color: tx.type === 'CREDIT' ? "#10b981" : "#ef4444"
          }));

          const mappedOrders = orders.map(order => ({
            id: order._id,
            type: 'order',
            title: order.status === 'completed' ? getTranslatedText("Pickup Completed") : getTranslatedText("New Request Created"),
            description: `${getTranslatedText("Status")}: ${order.status}`,
            amount: order.totalAmount ? `₹${order.totalAmount}` : null,
            timestamp: new Date(order.createdAt),
            displayTime: new Date(order.createdAt).toLocaleDateString(),
            icon: FaBox,
            color: "#3b82f6"
          }));

          // Merge and Sort by Date (Newest First)
          const allActivities = [...mappedTransactions, ...mappedOrders]
            .sort((a, b) => b.timestamp - a.timestamp);

          setActivities(allActivities);

          // 5. Calculate Analysis Data (Monthly Stats & Category Dist)

          // Monthly Stats (Last 6 Months)
          const last6Months = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
              month: d.toLocaleString('en-IN', { month: 'short' }),
              year: d.getFullYear(),
              monthIndex: d.getMonth(),
              requests: 0,
              earnings: 0
            });
          }

          // Aggregate Requests
          orders.forEach(order => {
            const d = new Date(order.createdAt);
            const mIndex = d.getMonth();
            const year = d.getFullYear();
            const period = last6Months.find(p => p.monthIndex === mIndex && p.year === year);
            if (period) {
              period.requests += 1;
            }
          });

          // Aggregate Earnings (Credit Transactions)
          transactions.forEach(tx => {
            if (tx.type === 'CREDIT') {
              const d = new Date(tx.createdAt);
              const mIndex = d.getMonth();
              const year = d.getFullYear();
              const period = last6Months.find(p => p.monthIndex === mIndex && p.year === year);
              if (period) {
                period.earnings += (tx.amount || 0);
              }
            }
          });

          setMonthlyStats(last6Months);

          // Category Distribution (Already calculated counts in step 3, refining here)
          const catDist = [];
          const totalItems = Object.values(categoryCount).reduce((a, b) => a + b, 0);

          const colors = ["#64946e", "#5a8263", "#4a7c5a", "#3a6c4a", "#2d5a3f"];
          let colorIndex = 0;

          Object.entries(categoryCount).forEach(([cat, count]) => {
            catDist.push({
              name: getTranslatedText(cat.charAt(0).toUpperCase() + cat.slice(1)),
              value: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
              count: count,
              color: colors[colorIndex % colors.length]
            });
            colorIndex++;
          });

          // If empty, show default empty state or nothing
          if (catDist.length === 0) {
            catDist.push({ name: getTranslatedText("No Data"), value: 100, color: "#e2e8f0" });
          }

          setCategoryStats(catDist);

        } catch (err) {
          console.error('Failed to fetch profile data:', err);
        } finally {
          setLoadingActivity(false);
        }
      };

      fetchData();
    }
  }, [user]);

  const handleSave = () => {
    console.log('Saving profile:', formData);
    setIsEditMode(false);
  };

  // Activity feed is now managing state 'activities'

  // Stats state
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    totalEarnings: 0,
    averageRating: user?.rating || 4.8, // Default or user rating if available
    totalWeight: 0,
    favoriteCategory: "-"
  });



  const quickActions = [
    {
      icon: <HiLocationMarker />,
      title: getTranslatedText("Saved Addresses"),
      desc: getTranslatedText("Manage pickup locations"),
      action: () => navigate("/saved-addresses"),
      color: "#10b981"
    },
    {
      icon: <MdAssignment />,
      title: getTranslatedText("My Requests"),
      desc: getTranslatedText("View pickup history & status"),
      action: () => navigate("/my-requests"),
      color: "#10b981"
    },
    {
      icon: <FaCommentAlt />,
      title: getTranslatedText("Chat"),
      desc: getTranslatedText("Messages with scrappers"),
      action: () => navigate("/chats"),
      color: "#10b981"
    },
    {
      icon: <FaBell />,
      title: getTranslatedText("Notifications"),
      desc: getTranslatedText("Manage notification settings"),
      action: () => navigate("/notifications"),
      color: "#10b981"
    },
    {
      icon: <FaQuestionCircle />,
      title: getTranslatedText("Help & Support"),
      desc: getTranslatedText("FAQ, contact support"),
      action: () => navigate("/help"),
      color: "#10b981"
    },
    {
      icon: <FaCog />,
      title: getTranslatedText("Terms & Conditions"),
      desc: getTranslatedText("Read platform terms & conditions"),
      action: () => navigate("/terms"),
      color: "#10b981"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 md:pb-0"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-3 md:px-6 lg:px-8 py-3 md:py-6"
        style={{ backgroundColor: "transparent" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1
            className="text-lg md:text-2xl font-bold"
            style={{ color: "#ffffff" }}>
            {getTranslatedText("My Profile")}
          </h1>

        </div>
      </div>

      <div className="px-3 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile Header Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-3 md:mb-6"
        >
          <div
            className="rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
            <AnimatePresence mode="wait">
              {!isEditMode ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 md:gap-4">
                  {/* Profile Picture */}
                  <div
                    className="w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 relative shadow-inner"
                    style={{
                      backgroundColor: '#ecfdf5',
                      border: '2px solid #10b981'
                    }}
                  >
                    {formData.profilePicture ? (
                      <img
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-lg md:text-3xl font-bold"
                        style={{ color: "#059669" }}>
                        {formData.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-base md:text-xl font-bold mb-0.5"
                      style={{ color: "#1e293b" }}>
                      {formData.name}
                    </h2>
                    <p
                      className="text-xs md:text-base mb-1"
                      style={{ color: "#64748b" }}>
                      {formData.phone}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#059669'
                        }}
                      >
                        {getTranslatedText("Verified")}
                      </span>
                      <span
                        className="text-[10px] md:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#059669'
                        }}
                      >
                        {stats.averageRating} <FaStar size={8} />
                      </span>
                    </div>

                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-emerald-50 transition-colors flex-shrink-0"
                    style={{
                      color: '#059669'
                    }}
                  >
                    <FaEdit size={14} className="md:w-5 md:h-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 md:space-y-4">
                  {/* Profile Picture Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner"
                        style={{
                          backgroundColor: '#ecfdf5',
                          border: '2px solid #10b981'
                        }}
                      >
                        {formData.profilePicture ? (
                          <img
                            src={URL.createObjectURL(formData.profilePicture)}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-xl md:text-4xl font-bold"
                            style={{ color: "#059669" }}>
                            {formData.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <label
                        htmlFor="profile-picture"
                        className="absolute bottom-0 right-0 w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110"
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff'
                        }}
                      >
                        <FaEdit size={10} className="md:w-3.5 md:h-3.5" />
                        <input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData({
                                ...formData,
                                profilePicture: e.target.files[0],
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-1"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Full Name")}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{
                        borderColor: '#e2e8f0',
                        color: '#1e293b',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-1"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Phone Number")}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{
                        borderColor: '#e2e8f0',
                        color: '#1e293b',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 md:gap-3 pt-2">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="flex-1 py-1.5 md:py-2.5 px-3 rounded-lg font-semibold text-xs md:text-base transition-all hover:bg-slate-50"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#64748b'
                      }}
                    >
                      {getTranslatedText("Cancel")}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-1.5 md:py-2.5 px-3 rounded-lg font-semibold text-xs md:text-base text-white transition-all shadow-md hover:shadow-lg"
                      style={{ backgroundColor: "#10b981" }}>
                      {getTranslatedText("Save Changes")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3 md:mb-6 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: "overview", label: getTranslatedText("Overview") },
            { id: "activity", label: getTranslatedText("Activity") },
            { id: "analysis", label: getTranslatedText("Analysis") },
            {
              id: "refer",
              label: getTranslatedText("Refer & Earn"),
              icon: FaGift,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 md:px-6 md:py-3 rounded-full md:rounded-lg font-semibold text-xs md:text-base whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm ${activeTab === tab.id ? 'text-white' : 'text-slate-600'
                }`}
              style={{
                backgroundColor: activeTab === tab.id ? "#10b981" : "#ffffff",
                border: "none",
                boxShadow: activeTab === tab.id ? "0 4px 6px -1px rgba(16, 185, 129, 0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
              }}>
              {tab.icon && <tab.icon className="text-xs md:text-sm" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 md:space-y-6">

              {/* Wallet Balance */}
              <div
                className="rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="font-bold text-sm md:text-lg"
                    style={{ color: "#ffffff" }}>
                    {getTranslatedText("Wallet Balance")}
                  </h3>
                  <button
                    onClick={() => navigate('/wallet')}
                    className="text-xs md:text-sm font-medium hover:underline text-white/90"
                  >
                    {getTranslatedText("View All")}
                  </button>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div
                    className="w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm"
                  >
                    <HiCash
                      className="text-xl md:text-3xl text-white"
                    />
                  </div>
                  <div>
                    <p
                      className="text-xl md:text-3xl font-bold text-white shadow-sm"
                    >
                      ₹{walletBalance.toFixed(2)}
                    </p>
                    <p
                      className="text-xs md:text-base text-emerald-100"
                    >
                      {getTranslatedText("Available balance")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Merged from old Profile.jsx */}
              <div
                className="rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm"
                style={{ backgroundColor: '#ffffff' }}
              >
                <h3
                  className="font-bold text-sm md:text-lg mb-3"
                  style={{ color: "#1e293b" }}>
                  {getTranslatedText("Quick Actions")}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={action.action}
                      className="p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md hover:border-emerald-200"
                      style={{
                        backgroundColor: "#f8fafc",
                        borderColor: "#f1f5f9"
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}
                      >
                        {action.icon}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-700">{action.title}</p>
                        <p className="text-[10px] text-slate-400 hidden md:block">{action.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div
                className="rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm"
                style={{ backgroundColor: '#ffffff' }}
              >
                <h3
                  className="font-bold text-sm md:text-lg mb-3"
                  style={{ color: "#1e293b" }}>
                  {getTranslatedText("Quick Stats")}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {[
                    { label: getTranslatedText('Total Requests'), value: stats.totalRequests, icon: FaBox, color: '#10b981' },
                    { label: getTranslatedText('Completed'), value: stats.completedRequests, icon: FaCheck, color: '#10b981' },
                    { label: getTranslatedText('Total Earnings'), value: `₹${walletBalance.toFixed(0)}`, icon: HiCash, color: '#10b981' },
                    { label: getTranslatedText('Total Weight'), value: `${stats.totalWeight} kg`, icon: FaWeight, color: '#10b981' },
                    { label: getTranslatedText('Avg Rating'), value: `${stats.averageRating}`, icon: FaStar, color: '#10b981' },
                    { label: getTranslatedText('Top Category'), value: getTranslatedText(stats.favoriteCategory), icon: FaTrophy, color: '#10b981' },
                  ].map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-2 md:p-4 rounded-lg md:rounded-xl text-center border border-slate-100"
                        style={{
                          backgroundColor: "#f8fafc",
                        }}>
                        <div className="flex justify-center mb-1.5">
                          <IconComponent
                            className="text-lg md:text-3xl"
                            style={{ color: stat.color }}
                          />
                        </div>
                        <p
                          className="text-base md:text-xl font-bold mb-0.5"
                          style={{ color: "#059669" }}>
                          {stat.value}
                        </p>
                        <p
                          className="text-[10px] md:text-sm leading-tight"
                          style={{ color: "#64748b" }}>
                          {stat.label}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}>
              {loadingActivity ? (
                <div className="text-center py-10">
                  <p className="text-slate-500">{getTranslatedText("Loading activity...")}</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {activities.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-100"
                      style={{ backgroundColor: "#ffffff" }}>
                      <div className="flex items-start gap-3 md:gap-4">
                        <div
                          className="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "#ecfdf5",
                          }}>
                          <item.icon
                            className="text-sm md:text-xl"
                            style={{ color: "#10b981" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4
                              className="font-bold text-xs md:text-base mr-2"
                              style={{ color: "#1e293b" }}>
                              {item.title}
                            </h4>
                            <span
                              className="text-[10px] md:text-xs whitespace-nowrap"
                              style={{ color: "#94a3b8" }}>
                              {item.displayTime}
                            </span>
                          </div>
                          <p
                            className="text-[10px] md:text-sm mt-0.5 line-clamp-1 md:line-clamp-none"
                            style={{ color: "#64748b" }}>
                            {item.description}
                          </p>
                          {item.amount && (
                            <p
                              className="text-xs md:text-sm font-bold mt-1"
                              style={{ color: "#059669" }}>
                              {item.amount}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "#ecfdf5" }}>
                    <FaChartLine
                      className="text-3xl"
                      style={{ color: "#10b981" }}
                    />
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: "#1e293b" }}>
                    {getTranslatedText("No activity yet.")}
                  </h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    {getTranslatedText("Start by creating a new pickup request!")}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 md:space-y-6">
              {/* Monthly Overview */}
              <div
                className="rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100"
                style={{ backgroundColor: "#ffffff" }}>
                <h3
                  className="font-bold text-base md:text-lg mb-4 flex items-center gap-2"
                  style={{ color: "#1e293b" }}>
                  <HiTrendingUp className="text-xl text-[#10b981]" />
                  {getTranslatedText("Monthly Requests & Earnings")}
                </h3>
                <div className="h-60 flex items-end justify-between gap-2 md:gap-4 mt-6">
                  {monthlyStats.map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col justify-end items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs p-2 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
                        <p>{data.requests} {getTranslatedText("Requests")}</p>
                        <p>₹{data.earnings} {getTranslatedText("Earnings")}</p>
                      </div>

                      <div className="w-full flex gap-1 items-end justify-center h-full">
                        <div
                          className="w-full max-w-[12px] md:max-w-[20px] rounded-t-sm opacity-50 transition-all group-hover:opacity-80"
                          style={{
                            height: `${Math.max((data.requests / 10) * 100, 5)}%`, // Mimimum height for visibility
                            backgroundColor: "#10b981",
                          }}
                        />
                        <div
                          className="w-full max-w-[12px] md:max-w-[20px] rounded-t-sm transition-all group-hover:opacity-90"
                          style={{
                            height: `${Math.max((data.earnings / 1000) * 100, 5)}%`, // Minimum height for visibility
                            backgroundColor: "#10b981",
                          }}
                        />
                      </div>
                      <p
                        className="text-xs mt-2 font-medium"
                        style={{ color: "#64748b" }}>
                        {data.month}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full opacity-50"
                      style={{ backgroundColor: "#10b981" }}
                    />
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {getTranslatedText("Requests")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#10b981" }}
                    />
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {getTranslatedText("Earnings")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div
                className="rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100"
                style={{ backgroundColor: "#ffffff" }}>
                <h3
                  className="font-bold text-base md:text-lg mb-4 flex items-center gap-2"
                  style={{ color: "#1e293b" }}>
                  <MdCategory className="text-xl text-[#10b981]" />
                  {getTranslatedText("Category Distribution")}
                </h3>
                <div className="space-y-4">
                  {categoryStats.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#1e293b" }}>
                          {item.name}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: item.color }}>
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "refer" && (
            <motion.div
              key="refer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ReferAndEarn getTranslatedText={getTranslatedText} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Button */}
        <div className="mt-8 mb-8 text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:bg-opacity-90"
            style={{
              backgroundColor: "#feb2b2",
              color: "#c53030",
            }}>
            <FaSignOutAlt />
            {getTranslatedText("Logout")}
          </button>
        </div>
      </div>
      <UserBottomNav />
    </motion.div>
  );
};

export default MyProfilePage;
