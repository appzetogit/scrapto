import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService } from '../../shared/services/wallet.service';
import { useAuth } from '../../shared/context/AuthContext';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const WalletPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [walletProfile, setWalletProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const profileData = await walletService.getWalletProfile();
            setWalletProfile(profileData);

            const trxData = await walletService.getTransactions(1, 20);
            setTransactions(trxData.transactions || []);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoney = async () => {
        if (!rechargeAmount || Number(rechargeAmount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        try {
            setProcessing(true);
            const res = await loadRazorpay();
            if (!res) {
                alert('Razorpay SDK failed to load');
                return;
            }

            const orderData = await walletService.createRechargeOrder(Number(rechargeAmount));

            const options = {
                key: orderData.data.keyId,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: "Scrapto Wallet",
                description: "Add Money to Wallet",
                order_id: orderData.data.orderId,
                handler: async function (response) {
                    try {
                        await walletService.verifyRecharge(response);
                        alert('Wallet Recharged Successfully!');
                        setShowAddMoneyModal(false);
                        setRechargeAmount('');
                        fetchWalletData(); // Refresh data
                    } catch (err) {
                        console.error(err);
                        alert('Recharge Verification Failed');
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: {
                    color: "#22c55e"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
            paymentObject.on('payment.failed', function (response) {
                alert(response.error.description);
                setProcessing(false);
            });

        } catch (error) {
            console.error(error);
            alert('Failed to initiate recharge');
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-white shadow sticky top-0 z-10">
                <div className="flex items-center px-4 py-3 gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">My Wallet</h1>
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-6">
                {/* Balance Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                    <div className="relative z-10">
                        <p className="text-emerald-100 text-sm font-medium mb-1">Total Balance</p>
                        <h2 className="text-4xl font-bold mb-6">₹{walletProfile?.balance?.toFixed(2) || '0.00'}</h2>

                        <button
                            onClick={() => setShowAddMoneyModal(true)}
                            className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Money
                        </button>
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        </svg>
                    </div>
                </motion.div>

                {/* Transactions */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 px-1">Recent Transactions</h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((trx) => (
                                <motion.div
                                    key={trx._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {trx.type === 'CREDIT' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                )}
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">
                                                {trx.category === 'RECHARGE' ? 'Wallet Recharge' :
                                                    trx.category === 'PAYMENT_SENT' ? 'Payment Sent' :
                                                        trx.category === 'PAYMENT_RECEIVED' ? 'Payment Received' :
                                                            trx.category === 'COMMISSION' ? 'Commission Deducted' :
                                                                trx.description}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatDate(trx.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${trx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                            {trx.type === 'CREDIT' ? '+' : '-'} ₹{Math.abs(trx.amount)}
                                        </p>
                                        {trx.status === 'FAILED' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Failed</span>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Money Modal */}
            <AnimatePresence>
                {showAddMoneyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAddMoneyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Add Money</h3>
                                <button onClick={() => setShowAddMoneyModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Enter Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                                    <input
                                        type="number"
                                        value={rechargeAmount}
                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>

                                {/* Quick Amounts */}
                                <div className="flex gap-2 mt-3">
                                    {[100, 500, 1000].map(amt => (
                                        <button
                                            key={amt}
                                            onClick={() => setRechargeAmount(amt.toString())}
                                            className="flex-1 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                                        >
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAddMoney}
                                disabled={processing}
                                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Processing...' : 'Proceed to Pay'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletPage;
