import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt,
  FaShoppingBag, FaHistory, FaBan, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import { adminAPI, adminOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const staticTexts = [
    "User not found",
    "Failed to load user data",
    "Are you sure you want to {action} this user?",
    "User {action}ed successfully",
    "Failed to {action} user",
    "block",
    "unblock",
    "Pending",
    "Accepted",
    "In Progress",
    "Completed",
    "Cancelled",
    "Loading user details...",
    "Back to Users List",
    "Back to Users",
    "Member since {date}",
    "Active",
    "Blocked",
    "Block User",
    "Unblock User",
    "Phone",
    "Email",
    "Address",
    "Not provided",
    "Total Orders",
    "Completed",
    "Total Spent",
    "Cancelled",
    "Order History",
    "Order ID",
    "Date",
    "Scrap Items",
    "Amount",
    "Scrapper",
    "Status",
    "No orders found for this user",
    "Mixed Scrap",
    "Unknown",
    "Unassigned"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load user details
      const userResponse = await adminAPI.getUserById(userId);
      if (!userResponse.success || !userResponse.data?.user) {
        throw new Error(userResponse.message || getTranslatedText('User not found'));
      }

      setUser(userResponse.data.user);

      // Load user's orders
      try {
        const ordersResponse = await adminOrdersAPI.getAll(`userId=${userId}`);
        if (ordersResponse.success && ordersResponse.data?.orders) {
          setOrders(ordersResponse.data.orders);
        } else {
          setOrders([]);
        }
      } catch (orderErr) {
        console.warn('Failed to load user orders:', orderErr);
        setOrders([]);
      }

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err.message || getTranslatedText('Failed to load user data'));
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUnblock = async () => {
    const action = user.isActive ? 'block' : 'unblock';
    const actionText = getTranslatedText(action);
    if (!window.confirm(getTranslatedText("Are you sure you want to {action} this user?", { action: actionText }))) return;

    setActionLoading(true);
    try {
      const response = await adminAPI.blockUser(userId);
      if (response.success) {
        // Update local state
        setUser(prev => ({ ...prev, isActive: !prev.isActive }));
        alert(getTranslatedText("User {action}ed successfully", { action: actionText }));
      } else {
        throw new Error(response.message || getTranslatedText("Failed to {action} user", { action: actionText }));
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      alert(err.message || getTranslatedText("Failed to {action} user", { action: actionText }));
    } finally {
      setActionLoading(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff7ed', color: '#c2410c', label: getTranslatedText('Pending') },
      accepted: { bg: '#eff6ff', color: '#1d4ed8', label: getTranslatedText('Accepted') },
      in_progress: { bg: '#fefce8', color: '#a16207', label: getTranslatedText('In Progress') },
      completed: { bg: '#f0fdf4', color: '#15803d', label: getTranslatedText('Completed') },
      cancelled: { bg: '#fef2f2', color: '#b91c1c', label: getTranslatedText('Cancelled') }
    };

    const style = styles[status] || styles.pending;

    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }} />
          <p style={{ color: '#718096' }}>{getTranslatedText("Loading user details...")}</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
          {error || getTranslatedText('User not found')}
        </p>
        <button
          onClick={() => navigate('/admin/users')}
          className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
          style={{ backgroundColor: '#64946e' }}
        >
          {getTranslatedText("Back to Users List")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: '#64946e' }}
      >
        <FaArrowLeft />
        {getTranslatedText("Back to Users")}
      </motion.button>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 mx-auto md:mx-0 text-3xl font-bold text-white uppercase"
            style={{ backgroundColor: '#64946e' }}
          >
            {user.name?.charAt(0) || 'U'}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#2d3748' }}>
                  {user.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {getTranslatedText("Member since {date}", { date: new Date(user.createdAt).toLocaleDateString() })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${user.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}>
                  {user.isActive ? <FaCheckCircle /> : <FaExclamationCircle />}
                  {user.isActive ? getTranslatedText('Active') : getTranslatedText('Blocked')}
                </span>

                <button
                  onClick={handleBlockUnblock}
                  disabled={actionLoading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${user.isActive
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                >
                  <FaBan />
                  {user.isActive ? getTranslatedText('Block User') : getTranslatedText('Unblock User')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <FaPhone className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{getTranslatedText("Phone")}</p>
                  <p className="font-semibold text-gray-700">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <FaEnvelope className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{getTranslatedText("Email")}</p>
                  <p className="font-semibold text-gray-700">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <FaMapMarkerAlt className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{getTranslatedText("Address")}</p>
                  <p className="font-semibold text-gray-700 truncate max-w-[200px]">
                    {user.address
                      ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.pincode || ''}`
                      : getTranslatedText('Not provided')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: getTranslatedText('Total Orders'), value: orders.length, icon: FaShoppingBag, color: '#64946e' },
          {
            label: getTranslatedText('Completed'),
            value: orders.filter(o => o.status === 'completed').length,
            icon: FaCheckCircle,
            color: '#10b981'
          },
          {
            label: getTranslatedText('Total Spent'),
            value: `₹${orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}`,
            icon: FaHistory,
            color: '#8b5cf6'
          },
          {
            label: getTranslatedText('Cancelled'),
            value: orders.filter(o => o.status === 'cancelled').length,
            icon: FaBan,
            color: '#ef4444'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                  <Icon style={{ color: stat.color, fontSize: '20px' }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: '#2d3748' }}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity / Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#2d3748' }}>
          <FaHistory />
          {getTranslatedText("Order History")}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">{getTranslatedText("Order ID")}</th>
                <th className="px-4 py-3">{getTranslatedText("Date")}</th>
                <th className="px-4 py-3">{getTranslatedText("Scrap Items")}</th>
                <th className="px-4 py-3">{getTranslatedText("Amount")}</th>
                <th className="px-4 py-3">{getTranslatedText("Scrapper")}</th>
                <th className="px-4 py-3 rounded-r-lg">{getTranslatedText("Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">
                    {getTranslatedText("No orders found for this user")}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-700">
                      #{order._id.substring(order._id.length - 6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.scrapItems?.map(item => item.category).join(', ') || getTranslatedText('Mixed Scrap')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      ₹{order.totalAmount || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.scrapper ? order.scrapper.name || getTranslatedText('Unknown') : getTranslatedText('Unassigned')}
                    </td>
                    <td className="px-4 py-3">
                      {getOrderStatusBadge(order.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDetail;
