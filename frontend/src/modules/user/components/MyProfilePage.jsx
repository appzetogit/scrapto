import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { walletService } from '../../shared/services/wallet.service';
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import ReferAndEarn from './ReferAndEarn';
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
  FaTimes,
  FaUser,
  FaPhone,
  FaSignOutAlt,
  FaGift
} from 'react-icons/fa';
import {
  HiTrendingUp,
  HiCollection,
  HiCash
} from 'react-icons/hi';
import {
  MdCategory,
  MdPayment,
  MdCheckCircleOutline
} from 'react-icons/md';

const MyProfilePage = () => {
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

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'User Name',
        phone: user.phone || '+91 98765 43210',
        profilePicture: null,
      });

      // Fetch Wallet Balance
      walletService.getWalletProfile()
        .then(data => setWalletBalance(data.balance || 0))
        .catch(err => console.error('Failed to fetch wallet:', err));
    }
  }, [user]);

  const handleSave = () => {
    console.log('Saving profile:', formData);
    setIsEditMode(false);
  };

  // Mock data for activity feed
  const activityFeed = [
    {
      id: 1,
      type: "request_completed",
      title: getTranslatedText("Pickup Completed"),
      description: getTranslatedText("Metal scrap pickup completed successfully"),
      amount: "₹450",
      timestamp: "2 hours ago",
      icon: FaCheckCircle,
      color: "#64946e",
    },
    {
      id: 2,
      type: "request_created",
      title: getTranslatedText("New Request Created"),
      description: getTranslatedText("Plastic scrap pickup requested"),
      amount: "₹180",
      timestamp: "1 day ago",
      icon: FaBox,
      color: "#64946e",
    },
    {
      id: 3,
      type: "payment_received",
      title: getTranslatedText("Payment Received"),
      description: getTranslatedText("Amount credited to wallet"),
      amount: "₹450",
      timestamp: "2 days ago",
      icon: FaWallet,
      color: "#64946e",
    },
    {
      id: 4,
      type: "request_accepted",
      title: getTranslatedText("Request Accepted"),
      description: getTranslatedText("Scrapper accepted your pickup request"),
      amount: null,
      timestamp: "3 days ago",
      icon: MdCheckCircleOutline,
      color: "#64946e",
    },
    {
      id: 5,
      type: "request_completed",
      title: getTranslatedText("Pickup Completed"),
      description: getTranslatedText("Electronics scrap pickup completed"),
      amount: "₹320",
      timestamp: "5 days ago",
      icon: FaCheckCircle,
      color: "#64946e",
    },
  ];

  // Mock stats data
  const stats = {
    totalRequests: 24,
    completedRequests: 18,
    totalEarnings: 1250,
    averageRating: 4.8,
    totalWeight: 156, // kg
    favoriteCategory: "Metal",
  };

  // Mock analysis data
  const monthlyData = [
    { month: "Jan", requests: 3, earnings: 450 },
    { month: "Feb", requests: 5, earnings: 680 },
    { month: "Mar", requests: 4, earnings: 520 },
    { month: "Apr", requests: 6, earnings: 890 },
    { month: "May", requests: 5, earnings: 750 },
    { month: "Jun", requests: 6, earnings: 920 },
  ];

  const categoryDistribution = [
    { name: getTranslatedText("Metal"), value: 45, color: "#64946e" },
    { name: getTranslatedText("Plastic"), value: 25, color: "#5a8263" },
    { name: getTranslatedText("Electronics"), value: 20, color: "#4a7c5a" },
    { name: getTranslatedText("Paper"), value: 10, color: "#3a6c4a" },
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
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-full hover:opacity-70 transition-opacity bg-white/20 backdrop-blur-sm shadow-sm"
            style={{ color: "#ffffff" }}
            aria-label={getTranslatedText("Go back")}>
            <FaTimes size={18} />
          </button>
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
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}>
              {activityFeed.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {activityFeed.map((item, index) => (
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
                              {item.timestamp}
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
                  {monthlyData.map((data, index) => (
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
                            height: `${(data.requests / 10) * 100}%`,
                            backgroundColor: "#10b981",
                          }}
                        />
                        <div
                          className="w-full max-w-[12px] md:max-w-[20px] rounded-t-sm transition-all group-hover:opacity-90"
                          style={{
                            height: `${(data.earnings / 1000) * 100}%`,
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
                  {categoryDistribution.map((item, index) => (
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
    </motion.div>
  );
};

export default MyProfilePage;
