import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaSearch, FaFilter, FaUserCheck, FaUserTimes, FaEye, FaPhone, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, blocked
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { login, isAuthenticated } = { login: () => { }, isAuthenticated: true }; // Placeholder or use context if needed
  const staticTexts = [
    "Failed to load users",
    "Are you sure you want to {action} this user?",
    "unblock",
    "block",
    "User unblocked successfully!",
    "Failed to unblock user",
    "User blocked successfully!",
    "Failed to block user",
    "Failed to update user status. Please try again.",
    "Active",
    "Blocked",
    "{count} min ago",
    "{count} hour ago",
    "{count} hours ago",
    "{count} day ago",
    "{count} days ago",
    "User Management",
    "Manage all registered users on the platform",
    "{count} Total Users",
    "Search by name, phone, or email...",
    "all",
    "active",
    "blocked",
    "Loading users...",
    "Error loading users",
    "Retry",
    "No users found",
    "Try a different search term",
    "No users registered yet",
    "{count} Requests",
    "Last active: {time}",
    "View",
    "Block",
    "Unblock"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadUsersData();
  }, [filter]);

  const loadUsersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filter === 'blocked') {
        queryParams.append('isActive', 'false');
      } else if (filter === 'active') {
        queryParams.append('isActive', 'true');
      }
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      queryParams.append('page', '1');
      queryParams.append('limit', '100');

      const response = await adminAPI.getAllUsers(queryParams.toString());

      if (response.success && response.data?.users) {
        // Transform backend data to frontend format
        const transformedUsers = response.data.users.map((user) => ({
          id: user._id || user.id,
          name: user.name || 'N/A',
          phone: user.phone || 'N/A',
          email: user.email || 'N/A',
          status: user.isActive === false ? 'blocked' : 'active',
          totalRequests: user.totalOrders || 0,
          walletBalance: user.walletBalance || 0,
          joinedAt: user.createdAt || new Date().toISOString(),
          lastActive: user.lastActive || user.updatedAt || new Date().toISOString(),
          blockedAt: user.blockedAt || null,
          blockReason: user.blockReason || null
        }));
        setUsers(transformedUsers);
      } else {
        setError(getTranslatedText('Failed to load users'));
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || getTranslatedText('Failed to load users'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter is now handled by backend query, but we can still filter locally for search
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const actionText = currentStatus === 'blocked' ? getTranslatedText('unblock') : getTranslatedText('block');
    if (window.confirm(
      getTranslatedText('Are you sure you want to {action} this user?', { action: actionText })
    )) {
      try {
        if (currentStatus === 'blocked') {
          // Unblock user (backend should handle this via updateUser or a separate endpoint)
          // For now, we'll use updateUser to set isActive: true
          const response = await adminAPI.updateUser(userId, { isActive: true });
          if (response.success) {
            setUsers(prev => prev.map(user =>
              user.id === userId
                ? { ...user, status: 'active', blockedAt: null, blockReason: null }
                : user
            ));
            alert(getTranslatedText('User unblocked successfully!'));
          } else {
            throw new Error(response.message || getTranslatedText('Failed to unblock user'));
          }
        } else {
          // Block user
          const response = await adminAPI.blockUser(userId);
          if (response.success) {
            setUsers(prev => prev.map(user =>
              user.id === userId
                ? {
                  ...user,
                  status: 'blocked',
                  blockedAt: new Date().toISOString(),
                  blockReason: 'Admin action'
                }
                : user
            ));
            alert(getTranslatedText('User blocked successfully!'));
          } else {
            throw new Error(response.message || getTranslatedText('Failed to block user'));
          }
        }
      } catch (error) {
        console.error('Error toggling user block status:', error);
        alert(error.message || getTranslatedText('Failed to update user status. Please try again.'));
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
          <FaUserCheck className="text-xs" />
          <span className="hidden sm:inline">{getTranslatedText("Active")}</span>
          <span className="sm:hidden">A</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
        <FaUserTimes className="text-xs" />
        <span className="hidden sm:inline">{getTranslatedText("Blocked")}</span>
        <span className="sm:hidden">B</span>
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
              {getTranslatedText("User Management")}
            </h1>
            <p className="text-xs md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Manage all registered users on the platform")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                {getTranslatedText("{count} Total Users", { count: users.length })}
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
              placeholder={getTranslatedText("Search by name, phone, or email...")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Debounce search - reload data after user stops typing
                const timeoutId = setTimeout(() => {
                  if (e.target.value) {
                    loadUsersData();
                  }
                }, 500);
                return () => clearTimeout(timeoutId);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadUsersData();
                }
              }}
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
            {['all', 'active', 'blocked'].map((status) => (
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
                {getTranslatedText(status)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Loading / Error State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }} />
          <p className="text-sm md:text-base font-semibold" style={{ color: '#2d3748' }}>
            {getTranslatedText("Loading users...")}
          </p>
        </motion.div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
        >
          <FaUserTimes className="mx-auto mb-4 text-4xl" style={{ color: '#ef4444' }} />
          <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#2d3748' }}>
            {getTranslatedText("Error loading users")}
          </h3>
          <p className="text-sm md:text-base mb-4" style={{ color: '#718096' }}>
            {error}
          </p>
          <button
            onClick={loadUsersData}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#64946e' }}
          >
            {getTranslatedText("Retry")}
          </button>
        </motion.div>
      )}

      {/* Users List */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <AnimatePresence>
            {filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center"
              >
                <FaUsers className="mx-auto mb-4" style={{ color: '#cbd5e0', fontSize: '48px' }} />
                <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("No users found")}
                </p>
                <p className="text-sm" style={{ color: '#718096' }}>
                  {searchQuery ? getTranslatedText('Try a different search term') : getTranslatedText('No users registered yet')}
                </p>
              </motion.div>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== filteredUsers.length - 1 ? 'border-b' : ''
                    }`}
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-2 md:gap-4">
                        <div
                          className="w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#f7fafc' }}
                        >
                          <span className="text-base md:text-2xl font-bold" style={{ color: '#64946e' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 flex-wrap">
                            <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                              {user.name}
                            </h3>
                            {getStatusBadge(user.status)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2 text-xs md:text-sm" style={{ color: '#718096' }}>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaPhone className="text-xs" />
                              <span className="truncate">{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaMapMarkerAlt className="text-xs" />
                              <span>{getTranslatedText("{count} Requests", { count: user.totalRequests })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <FaRupeeSign className="text-xs" />
                              <span>₹{user.walletBalance}</span>
                            </div>
                            <div className="text-xs">
                              {getTranslatedText("Last active: {time}", { time: getTimeAgo(user.lastActive) })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(user.id)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      >
                        <FaEye className="text-xs md:text-sm" />
                        <span className="hidden sm:inline">{getTranslatedText("View")}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleBlock(user.id, user.status)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${user.status === 'blocked' ? 'hidden' : ''
                          }`}
                        style={{
                          backgroundColor: user.status === 'blocked' ? '#fee2e2' : '#fee2e2',
                          color: '#dc2626'
                        }}
                      >
                        <FaUserTimes />
                        <span className="hidden sm:inline">{getTranslatedText("Block")}</span>
                      </motion.button>
                      {user.status === 'blocked' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleBlock(user.id, user.status)}
                          className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all"
                          style={{ backgroundColor: '#d1fae5', color: '#10b981' }}
                        >
                          <FaUserCheck className="text-xs md:text-sm" />
                          <span className="hidden sm:inline">{getTranslatedText("Unblock")}</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default UsersList;

