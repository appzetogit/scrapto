import { motion } from 'framer-motion';
import { useState } from 'react';

const Profile = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState(null);

  const profileOptions = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'My Profile',
      desc: 'Edit name, phone, profile picture',
      action: () => setActiveSection('profile'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      title: 'Saved Addresses',
      desc: 'Manage pickup locations',
      action: () => setActiveSection('addresses'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      title: 'Wallet',
      desc: 'Balance: ₹1,250 | Transactions',
      action: () => setActiveSection('wallet'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'My Requests',
      desc: 'View pickup history & status',
      action: () => setActiveSection('requests'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      ),
      title: 'Chat',
      desc: 'Messages with scrappers',
      action: () => setActiveSection('chat'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      title: 'Notifications',
      desc: 'Manage notification settings',
      action: () => setActiveSection('notifications'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      title: 'Help & Support',
      desc: 'FAQ, contact support',
      action: () => setActiveSection('support'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
        </svg>
      ),
      title: 'Settings',
      desc: 'App preferences & privacy',
      action: () => setActiveSection('settings'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 md:pb-0"
      style={{ backgroundColor: '#f4ebe2' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6" style={{ backgroundColor: '#f4ebe2' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 
            className="text-xl md:text-2xl font-bold"
            style={{ color: '#2d3748' }}
          >
            Profile
          </h1>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: '#64946e' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
          <div 
            className="rounded-2xl p-4 md:p-6 shadow-md"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: 'rgba(100, 148, 110, 0.15)',
                  border: '3px solid rgba(100, 148, 110, 0.3)'
                }}
              >
                <span 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: '#64946e' }}
                >
                  U
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 
                  className="text-lg md:text-xl font-bold mb-1"
                  style={{ color: '#2d3748' }}
                >
                  User Name
                </h2>
                <p 
                  className="text-sm md:text-base mb-1"
                  style={{ color: '#718096' }}
                >
                  +91 98765 43210
                </p>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(100, 148, 110, 0.1)',
                      color: '#64946e'
                    }}
                  >
                    Verified
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{ 
                  backgroundColor: 'rgba(100, 148, 110, 0.1)',
                  color: '#64946e'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
          {profileOptions.map((option, index) => (
            <motion.button
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              onClick={option.action}
              className="text-left p-3 md:p-4 rounded-xl transition-all duration-300 hover:shadow-lg"
              style={{ 
                backgroundColor: '#ffffff',
                border: '1px solid rgba(100, 148, 110, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#64946e';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(100, 148, 110, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: 'rgba(100, 148, 110, 0.1)',
                    color: '#64946e'
                  }}
                >
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-sm md:text-base mb-1"
                    style={{ color: '#2d3748' }}
                  >
                    {option.title}
                  </h3>
                  <p 
                    className="text-xs md:text-sm"
                    style={{ color: '#718096' }}
                  >
                    {option.desc}
                  </p>
                </div>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="flex-shrink-0"
                  style={{ color: '#64946e' }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-6"
        >
          <div 
            className="rounded-2xl p-4 md:p-6"
            style={{ backgroundColor: '#ffffff' }}
          >
            <h3 
              className="font-bold text-base md:text-lg mb-4"
              style={{ color: '#2d3748' }}
            >
              Quick Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Requests', value: '24' },
                { label: 'Completed', value: '18' },
                { label: 'Earnings', value: '₹1,250' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p 
                    className="text-xl md:text-2xl font-bold mb-1"
                    style={{ color: '#64946e' }}
                  >
                    {stat.value}
                  </p>
                  <p 
                    className="text-xs md:text-sm"
                    style={{ color: '#718096' }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full p-4 rounded-xl font-semibold transition-all duration-300 mb-20 md:mb-8"
          style={{ 
            backgroundColor: '#ffffff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          Logout
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Profile;

