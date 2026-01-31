import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { getNotifications, markNotificationAsRead, getUnreadNotificationCount } from '../../shared/utils/referralUtils';
import { FaBell, FaArrowLeft } from 'react-icons/fa';
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const staticTexts = [
        "Notifications",
        "No notifications yet",
        "Mark all read",
        "Loading..."
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);

    useEffect(() => {
        if (user) {
            const userId = user.phone || user.id;
            loadNotifications(userId);
        }
    }, [user]);

    const loadNotifications = (userId) => {
        setLoading(true);
        // Simulate slight delay for authentic feel or just load
        const notifs = getNotifications(userId, 'user');
        setNotifications(notifs);
        setLoading(false);
    };

    const handleMarkAsRead = (notificationId) => {
        markNotificationAsRead(notificationId, 'user');
        loadNotifications(user?.phone || user?.id);
    };

    const handleMarkAllAsRead = () => {
        notifications.forEach(notif => {
            if (!notif.read) {
                markNotificationAsRead(notif.id, 'user');
            }
        });
        loadNotifications(user?.phone || user?.id);
    };

    return (
        <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}>
            {/* Header */}
            <div
                className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6"
                style={{ background: "transparent" }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:opacity-70 transition-opacity bg-white/20 backdrop-blur-sm shadow-sm"
                            style={{ color: "#ffffff" }}>
                            <FaArrowLeft size={20} />
                        </button>
                        <h1
                            className="text-xl md:text-2xl font-bold"
                            style={{ color: "#ffffff" }}>
                            {getTranslatedText("Notifications")}
                        </h1>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-white text-sm font-medium hover:underline bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm"
                        >
                            {getTranslatedText("Mark all read")}
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 max-w-4xl mx-auto pb-6">
                {loading ? (
                    <div className="text-center py-10 text-white">
                        <p>{getTranslatedText("Loading...")}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm">
                        <FaBell className="text-4xl mx-auto mb-4" style={{ color: '#cbd5e0' }} />
                        <p className="text-lg text-slate-600 font-medium">
                            {getTranslatedText("No notifications yet")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 rounded-xl cursor-pointer transition-all shadow-sm ${!notif.read ? 'bg-white border-l-4 border-emerald-500' : 'bg-white/90 backdrop-blur-sm'
                                    }`}
                                onClick={() => handleMarkAsRead(notif.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-emerald-500' : 'bg-transparent'
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-base mb-1">
                                            {notif.title}
                                        </p>
                                        <p className="text-slate-600 text-sm mb-2 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
