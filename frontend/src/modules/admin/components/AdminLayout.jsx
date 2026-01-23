import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../shared/context/AdminAuthContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaHome,
  FaUserShield,
  FaUsers,
  FaTruck,
  FaRupeeSign,
  FaFileInvoice,
  FaCreditCard,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaGift,
  FaBullhorn
} from 'react-icons/fa';
import siteLogo from '../../../assets/scraptologo-removebg-preview.png';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminAuth();
  const staticTexts = [
    "Dashboard",
    "KYC Queue",
    "Users",
    "Scrappers",
    "All Scrappers",
    "Leads",
    "Price Feed",
    "Requests",
    "Subscriptions",
    "All Subscriptions",
    "Manage Plans",
    "Referrals",
    "Settings",
    "Milestone Rewards",
    "Tier Management",
    "Leaderboard",
    "Analytics",
    "Fraud Detection",
    "Campaigns",
    "Reports",
    "Ad Banners",
    "Admin Panel",
    "Scrapto",
    "Logout",
    "Administrator"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const menuItems = [
    { icon: FaHome, label: getTranslatedText('Dashboard'), path: '/admin', exact: true },
    { icon: FaUserShield, label: getTranslatedText('KYC Queue'), path: '/admin/kyc' },
    { icon: FaUsers, label: getTranslatedText('Users'), path: '/admin/users' },
    {
      icon: FaTruck, label: getTranslatedText('Scrappers'), path: '/admin/scrappers', submenu: [
        { label: getTranslatedText('All Scrappers'), path: '/admin/scrappers' },
        { label: getTranslatedText('Leads'), path: '/admin/scrappers/leads' }
      ]
    },
    { icon: FaRupeeSign, label: getTranslatedText('Price Feed'), path: '/admin/prices' },
    { icon: FaFileInvoice, label: getTranslatedText('Requests'), path: '/admin/requests' },
    { icon: FaRupeeSign, label: getTranslatedText('Earnings'), path: '/admin/earnings' },
    {
      icon: FaCreditCard, label: getTranslatedText('Subscriptions'), path: '/admin/subscriptions', submenu: [
        { label: getTranslatedText('All Subscriptions'), path: '/admin/subscriptions' },
        { label: getTranslatedText('Manage Plans'), path: '/admin/subscriptions/plans' }
      ]
    },
    {
      icon: FaGift, label: getTranslatedText('Referrals'), path: '/admin/referrals', submenu: [
        { label: getTranslatedText('All Referrals'), path: '/admin/referrals' },
        { label: getTranslatedText('Settings'), path: '/admin/referrals/settings' },
        { label: getTranslatedText('Milestone Rewards'), path: '/admin/referrals/milestones' },
        { label: getTranslatedText('Tier Management'), path: '/admin/referrals/tiers' },
        { label: getTranslatedText('Leaderboard'), path: '/admin/referrals/leaderboard' },
        { label: getTranslatedText('Analytics'), path: '/admin/referrals/analytics' },
        { label: getTranslatedText('Fraud Detection'), path: '/admin/referrals/fraud' },
        { label: getTranslatedText('Campaigns'), path: '/admin/referrals/campaigns' }
      ]
    },
    { icon: FaGift, label: getTranslatedText('Coupons'), path: '/admin/coupons' },
    { icon: FaChartBar, label: getTranslatedText('Reports'), path: '/admin/reports' },
    { icon: FaBullhorn, label: getTranslatedText('Ad Banners'), path: '/admin/banners' },
    { icon: FaCog, label: getTranslatedText('Settings'), path: '/admin/settings' }
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ backgroundColor: '#f4ebe2' }}>
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden md:flex md:w-64 lg:w-72 flex-col bg-white shadow-lg h-screen fixed left-0 top-0 z-30"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Logo */}
        <div className="p-6 border-b flex-shrink-0" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-center">
            <img src={siteLogo} alt="Scrapto" className="h-16 w-auto object-contain" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item);
            const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
            const isParentActive =
              hasSubmenu && item.submenu.some((sub) => location.pathname === sub.path);

            return (
              <div key={item.path}>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!hasSubmenu) {
                      navigate(item.path);
                    } else if (!isParentActive) {
                      navigate(item.submenu[0].path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active || isParentActive ? 'shadow-md' : ''
                    }`}
                  style={{
                    backgroundColor: active || isParentActive ? '#64946e' : 'transparent',
                    color: active || isParentActive ? '#ffffff' : '#2d3748'
                  }}
                >
                  <Icon className="text-lg" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>

                {hasSubmenu && (active || isParentActive) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-6 mt-2 space-y-1"
                  >
                    {item.submenu.map((sub, subIndex) => (
                      <motion.button
                        key={sub.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: subIndex * 0.03 }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(sub.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm transition-all ${location.pathname === sub.path ? 'font-semibold' : ''
                          }`}
                        style={{
                          backgroundColor:
                            location.pathname === sub.path
                              ? 'rgba(100, 148, 110, 0.08)'
                              : 'transparent',
                          color:
                            location.pathname === sub.path ? '#64946e' : '#718096'
                        }}
                      >
                        <span>{sub.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Admin Info & Logout */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: '#e2e8f0' }}>
          <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
            <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>{admin?.name || 'Admin'}</p>
            <p className="text-xs" style={{ color: '#718096' }}>{admin?.email || 'admin@scrapto.com'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:shadow-md"
            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
          >
            <FaSignOutAlt />
            <span className="font-medium">{getTranslatedText("Logout")}</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col bg-white shadow-2xl md:hidden"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-center">
                  <img src={siteLogo} alt="Scrapto" className="h-12 w-auto object-contain" />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <FaTimes style={{ color: '#2d3748' }} />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
                  const isParentActive =
                    hasSubmenu && item.submenu.some((sub) => location.pathname === sub.path);

                  return (
                    <div key={item.path}>
                      <button
                        onClick={() => {
                          if (!hasSubmenu) {
                            navigate(item.path);
                            setSidebarOpen(false);
                          } else if (!isParentActive) {
                            navigate(item.submenu[0].path);
                            // Don't close sidebar if opening a submenu section, or do close? 
                            // Usually user wants to see where they are going. 
                            // But usually submenus are expanded. 
                            // Let's keep it consistent: click parent -> go to first child -> close sidebar
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active || isParentActive ? 'shadow-md' : ''
                          }`}
                        style={{
                          backgroundColor: active || isParentActive ? '#64946e' : 'transparent',
                          color: active || isParentActive ? '#ffffff' : '#2d3748'
                        }}
                      >
                        <Icon className="text-lg" />
                        <span className="font-medium">{item.label}</span>
                      </button>

                      {hasSubmenu && (active || isParentActive) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="ml-6 mt-2 space-y-1"
                        >
                          {item.submenu.map((sub, subIndex) => (
                            <button
                              key={sub.path}
                              onClick={() => {
                                navigate(sub.path);
                                setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm transition-all ${location.pathname === sub.path ? 'font-semibold' : ''
                                }`}
                              style={{
                                backgroundColor:
                                  location.pathname === sub.path
                                    ? 'rgba(100, 148, 110, 0.08)'
                                    : 'transparent',
                                color:
                                  location.pathname === sub.path ? '#64946e' : '#718096'
                              }}
                            >
                              <span>{sub.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
                  <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>{admin?.name || 'Admin'}</p>
                  <p className="text-xs" style={{ color: '#718096' }}>{admin?.email || 'admin@scrapto.com'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:shadow-md"
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                >
                  <FaSignOutAlt />
                  <span className="font-medium">{getTranslatedText("Logout")}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 lg:ml-72">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-20" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <FaBars style={{ color: '#2d3748', fontSize: '20px' }} />
          </button>
          <div className="flex-1 md:flex-none">
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#2d3748' }}>
              {menuItems.find(item => isActive(item))?.label || getTranslatedText('Dashboard')}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>{admin?.name || 'Admin'}</p>
              <p className="text-xs" style={{ color: '#718096' }}>{admin?.role || getTranslatedText('Administrator')}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/profile')}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:shadow-md"
              style={{ backgroundColor: '#64946e' }}
            >
              <span className="text-white font-bold text-sm">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </motion.button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
