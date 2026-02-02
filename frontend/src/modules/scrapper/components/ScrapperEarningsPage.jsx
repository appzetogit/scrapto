import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { earningsAPI } from '../../shared/utils/api';
import { FaArrowLeft, FaCalendarAlt, FaDownload } from 'react-icons/fa';

const ScrapperEarningsPage = () => {
    const navigate = useNavigate();
    const [earnings, setEarnings] = useState({
        today: 0,
        week: 0,
        month: 0,
        total: 0
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const staticTexts = [
        "My Earnings",
        "View your earning summary and history",
        "Total Earnings",
        "Today",
        "This Week",
        "This Month",
        "Earnings History",
        "No completed orders yet",
        "Completed",
        "Order ID",
        "Unknown User",
        "Scrap",
        "Download Statement"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Summary
            const summaryRes = await earningsAPI.getSummary();
            if (summaryRes.success && summaryRes.data?.summary) {
                const s = summaryRes.data.summary;
                setEarnings({
                    today: s.today || 0,
                    week: s.week || 0,
                    month: s.month || 0,
                    total: s.total || 0
                });
            }

            // Fetch History
            const historyRes = await earningsAPI.getHistory();
            if (historyRes.success && historyRes.data?.history) {
                setHistory(historyRes.data.history);
            }
        } catch (error) {
            console.error("Failed to load earnings:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#f4ebe2] pb-20">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-4 pt-6 sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-emerald-700 transition-colors"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{getTranslatedText("My Earnings")}</h1>
                        <p className="text-emerald-100 text-xs">{getTranslatedText("View your earning summary and history")}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Total Earnings Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 text-center"
                >
                    <p className="text-gray-500 text-sm mb-1">{getTranslatedText("Total Earnings")}</p>
                    <h2 className="text-4xl font-bold text-emerald-600">₹{earnings.total.toLocaleString()}</h2>
                </motion.div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-3 shadow-sm border border-emerald-50 text-center"
                    >
                        <p className="text-xs text-gray-500 mb-1">{getTranslatedText("Today")}</p>
                        <p className="font-bold text-emerald-600">₹{earnings.today.toLocaleString()}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-xl p-3 shadow-sm border border-emerald-50 text-center"
                    >
                        <p className="text-xs text-gray-500 mb-1">{getTranslatedText("This Week")}</p>
                        <p className="font-bold text-emerald-600">₹{earnings.week.toLocaleString()}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-3 shadow-sm border border-emerald-50 text-center"
                    >
                        <p className="text-xs text-gray-500 mb-1">{getTranslatedText("This Month")}</p>
                        <p className="font-bold text-emerald-600">₹{earnings.month.toLocaleString()}</p>
                    </motion.div>
                </div>

                {/* Detailed History List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">{getTranslatedText("Earnings History")}</h3>
                        {/* Download button could be added here in future */}
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                            <p className="text-gray-500">{getTranslatedText("No completed orders yet")}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((order, index) => {
                                const amount = order.amount !== undefined ? order.amount : 0;
                                return (
                                    <motion.div
                                        key={order.id || index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * index }}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <FaCalendarAlt />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{order.userName || getTranslatedText('Unknown User')}</p>
                                                <p className="text-xs text-gray-500">
                                                    {getTranslatedText(order.scrapType || 'Scrap')} • {formatDate(order.completedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">₹{amount}</p>
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{getTranslatedText("Completed")}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ScrapperEarningsPage;
