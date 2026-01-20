import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../shared/utils/api';

const Earnings = () => {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [dateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPaymentAnalytics();
            if (response && response.success) {
                setAnalyticsData(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch payment analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !analyticsData) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    // Calculate Admin Balance safely
    const adminBalance = analyticsData?.adminWalletBalance || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Earnings & Transactions</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{analyticsData?.totalRevenue?.toLocaleString() || '0'}</h3>
                            <p className="text-xs text-gray-400">Merged (Payments + Commissions)</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Commission Earned</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{analyticsData?.revenueBreakdown?.commissions?.toLocaleString() || '0'}</h3>
                            <p className="text-xs text-green-600">1% on Orders</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-lg text-white"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-white/10">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Admin Wallet Balance</p>
                        <h3 className="text-3xl font-bold mt-1">₹{adminBalance.toLocaleString()}</h3>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 0 00-2 2v12a2 0 002 2h10a2 0 002-2V7a2 0 00-2-2h-2M9 5a2 0 002 2h2a2 0 002-2M9 5a2 0 012-2h2a2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-gray-900">{analyticsData?.totalPayments?.toLocaleString() || '0'}</h3>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Revenue Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
            >
                <h2 className="mb-6 text-lg font-bold text-gray-800">Revenue Overview</h2>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    {/* <Line options={chartOptions} data={chartData} /> */}
                    <p className="text-gray-400">Chart visualization is momentarily disabled for maintenance.</p>
                </div>
            </motion.div>

            {/* Monthly Breakdown Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-800">Monthly Breakdown</h3>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Month</th>
                                    <th className="px-6 py-3">Transaction Count</th>
                                    <th className="px-6 py-3 text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Array.isArray(analyticsData?.monthlyRevenue) && analyticsData.monthlyRevenue.map((item, index) => {
                                    if (!item) return null;
                                    return (
                                        <tr key={item._id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item._id || 'N/A'}</td>
                                            <td className="px-6 py-4">{item.count || 0}</td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{(item.total || 0).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                                {(!analyticsData?.monthlyRevenue || analyticsData.monthlyRevenue.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Earnings;
