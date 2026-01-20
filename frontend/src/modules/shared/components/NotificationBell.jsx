import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  getUnreadNotificationCount 
} from '../utils/referralUtils';
import { useAuth } from '../context/AuthContext';
import { FaBell, FaTimes } from 'react-icons/fa';

const NotificationBell = ({ userType = 'user' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const userId = user.phone || user.id;
      const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
      const actualUserId = userType === 'scrapper' 
        ? (scrapperUser.phone || scrapperUser.id || userId)
        : userId;
      
      loadNotifications(actualUserId);
      
      // Check for new notifications periodically
      const interval = setInterval(() => {
        loadNotifications(actualUserId);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user, userType]);

  const loadNotifications = (userId) => {
    if (!userId) return;
    
    const notifs = getNotifications(userId, userType);
    setNotifications(notifs);
    
    const unread = getUnreadNotificationCount(userId, userType);
    setUnreadCount(unread);
  };

  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(notificationId, userType);
    loadNotifications(user?.phone || user?.id);
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(notif => {
      if (!notif.read) {
        markNotificationAsRead(notif.id, userType);
      }
    });
    loadNotifications(user?.phone || user?.id);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-all"
        style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
      >
        <FaBell className="text-xl" style={{ color: '#64946e' }} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: '#ef4444' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-2xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="font-bold text-lg" style={{ color: '#2d3748' }}>
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)', color: '#64946e' }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full transition-all hover:bg-gray-100"
                  >
                    <FaTimes style={{ color: '#718096' }} />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <FaBell className="text-4xl mx-auto mb-2" style={{ color: '#cbd5e0' }} />
                    <p className="text-sm" style={{ color: '#718096' }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#e2e8f0' }}>
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 cursor-pointer transition-all ${
                          !notif.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (!notif.read) {
                            handleMarkAsRead(notif.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              !notif.read ? 'bg-blue-500' : 'bg-transparent'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm mb-1" style={{ color: '#2d3748' }}>
                              {notif.title}
                            </p>
                            <p className="text-xs mb-2" style={{ color: '#718096' }}>
                              {notif.message}
                            </p>
                            <p className="text-xs" style={{ color: '#cbd5e0' }}>
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;

