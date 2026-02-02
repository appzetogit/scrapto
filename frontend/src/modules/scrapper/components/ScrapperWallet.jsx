import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { FaWallet, FaHistory, FaArrowUp, FaArrowDown, FaExclamationCircle, FaTimes, FaMoneyBillWave, FaUniversity } from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { walletAPI } from '../../shared/utils/api';
import useRazorpay from '../../../hooks/useRazorpay';

import ScrapperBottomNav from './ScrapperBottomNav';

const ScrapperWallet = () => {
    const { user } = useAuth();
    const { initializePayment } = useRazorpay();
    const staticTexts = [
        "My Wallet",
        "Total Balance",
        "Available Balance",
        "Recent Transactions",
        "Withdraw",
        "Add Money",
        "No transactions yet",
        "Completed Pickup",
        "Withdrawal",
        "Recharge",
        "Commission",
        "Payment Sent",
        "Payment Received",
        "Refund",
        "Bonus",
        "Status",
        "Date",
        "Amount",
        "Pending Clearance",
        "Enter Amount to Add",
        "Add Funds",
        "Processing...",
        "Withdraw Funds",
        "Enter Amount to Withdraw",
        "Withdrawal Amount",
        "Enter UPI ID or Bank Details",
        "Payment Method",
        "UPI ID",
        "Request Withdrawal",
        "Insufficient Balance",
        "Minimum Amount is ₹1",
        "Minimum Withdrawal is ₹100",
        "Request Submitted Successfully",
        "Failed to submit request",
        "Payment Successful",
        "Failed to initiate payment"
    ];

    const { getTranslatedText } = usePageTranslation(staticTexts);
    const [balance, setBalance] = useState({ available: 0, pending: 0, total: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [amount, setAmount] = useState('');
    const [withdrawDetails, setWithdrawDetails] = useState({ amount: '', method: 'UPI', upiId: '', accountHolderName: '', accountNumber: '', ifscCode: '' });
    const [processing, setProcessing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [showCouponSection, setShowCouponSection] = useState(false);
    const [showCouponsList, setShowCouponsList] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);

    const fetchCoupons = async () => {
        setLoadingCoupons(true);
        try {
            const res = await walletAPI.getAvailableCoupons();
            if (res.success) {
                setAvailableCoupons(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
        } finally {
            setLoadingCoupons(false);
        }
    };

    const fetchWalletData = async () => {
        try {
            // Fetch wallet profile which contains balance and recent transactions
            const res = await walletAPI.getWalletProfile();

            if (res.success && res.data) {
                setBalance({
                    available: res.data.balance || 0,
                    pending: 0,
                    total: res.data.balance || 0
                });

                if (res.data.transactions) {
                    setTransactions(res.data.transactions);
                }
            }
        } catch (error) {
            console.error("Failed to fetch wallet data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleAddMoney = async (e) => {
        e.preventDefault();
        if (!amount || amount < 1) {
            alert(getTranslatedText("Minimum Amount is ₹1"));
            return;
        }

        setProcessing(true);
        try {
            // 1. Create Order
            const orderRes = await walletAPI.createRechargeOrder(Number(amount));
            if (!orderRes.success) throw new Error(orderRes.message);

            const { orderId, amount: orderAmount, currency, keyId } = orderRes.data;

            // 2. Open Razorpay
            const options = {
                key: keyId,
                amount: orderAmount,
                currency: currency,
                name: "Scrapto Wallet",
                description: "Add Money to Wallet",
                order_id: orderId,
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: { color: "#10b981" }
            };

            await initializePayment(options, async (response) => {
                // 3. Verify Payment
                try {
                    const verifyRes = await walletAPI.verifyRecharge({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        amount: Number(amount)
                    });

                    if (verifyRes.success) {
                        alert(getTranslatedText("Payment Successful"));
                        setShowAddMoney(false);
                        setAmount('');
                        fetchWalletData(); // Refresh balance
                    } else {
                        alert(verifyRes.message || "Verification Failed");
                    }
                } catch (err) {
                    console.error("Verification error:", err);
                    alert("Payment verification failed");
                }
            });

        } catch (error) {
            console.error("Add Money Failed:", error);
            alert(error.message || getTranslatedText("Failed to initiate payment"));
        } finally {
            setProcessing(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode || couponCode.trim() === '') {
            alert('Please enter a coupon code');
            return;
        }

        try {
            setApplyingCoupon(true);
            const response = await walletAPI.applyCoupon(couponCode.toUpperCase());

            if (response.success) {
                alert(`Success! ₹${response.data.amountCredited} added to your wallet!`);
                setCouponCode('');
                setShowCouponSection(false);
                fetchWalletData(); // Refresh wallet data
            }
        } catch (error) {
            console.error('Apply coupon error:', error);
            alert(error.message || 'Failed to apply coupon. Please check the code and try again.');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const withdrawAmount = Number(withdrawDetails.amount);

        if (withdrawAmount < 100) {
            alert(getTranslatedText("Minimum Withdrawal is ₹100"));
            return;
        }
        if (withdrawAmount > balance.available) {
            alert(getTranslatedText("Insufficient Balance"));
            return;
        }
        if (!withdrawDetails.upiId && !withdrawDetails.accountNumber) {
            alert(getTranslatedText("Enter UPI ID or Bank Details"));
            return;
        }

        setProcessing(true);
        try {
            const res = await walletAPI.requestWithdrawal(withdrawAmount, {
                method: withdrawDetails.method,
                upiId: withdrawDetails.upiId,
                accountNumber: withdrawDetails.accountNumber,
                ifscCode: withdrawDetails.ifscCode,
                accountHolderName: withdrawDetails.accountHolderName
            });

            if (res.success) {
                alert(getTranslatedText("Request Submitted Successfully"));
                setShowWithdraw(false);
                setWithdrawDetails({ amount: '', method: 'UPI', upiId: '', accountHolderName: '', accountNumber: '', ifscCode: '' });
                fetchWalletData();
            }
        } catch (error) {
            console.error("Withdrawal Failed:", error);
            alert(error.message || getTranslatedText("Failed to submit request"));
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="min-h-screen pb-20" style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}>
            {/* Header for Mobile */}
            <div className="md:hidden sticky top-0 z-40 px-4 py-4" style={{ background: "transparent" }}>
                <h1 className="text-xl font-bold text-white">{getTranslatedText("My Wallet")}</h1>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8">

                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FaWallet size={100} />
                    </div>

                    <div className="relative z-10">
                        <p className="text-emerald-100 text-sm font-medium mb-1">{getTranslatedText("Total Balance")}</p>
                        <h2 className="text-4xl font-bold mb-6">₹{balance.total.toLocaleString()}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-emerald-100 text-xs mb-1">{getTranslatedText("Available Balance")}</p>
                                <p className="text-xl font-semibold">₹{balance.available.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-emerald-100 text-xs mb-1">{getTranslatedText("Pending Clearance")}</p>
                                <p className="text-xl font-semibold">₹{balance.pending.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setShowWithdraw(true)}
                        className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
                    >
                        <FaArrowUp />
                        {getTranslatedText("Withdraw")}
                    </button>
                    <button
                        onClick={() => setShowAddMoney(true)}
                        className="flex items-center justify-center gap-2 bg-white text-slate-800 py-3 px-4 rounded-xl font-semibold shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <FaArrowDown />
                        {getTranslatedText("Add Money")}
                    </button>
                </div>

                {/* Coupon Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8"
                >
                    <button
                        onClick={() => setShowCouponSection(!showCouponSection)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Have a Coupon?</p>
                                <p className="text-xs text-gray-500">Apply code to get instant credit</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCouponsList(true);
                                    fetchCoupons();
                                }}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                View Offers
                            </button>
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${showCouponSection ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    <AnimatePresence>
                        {showCouponSection && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code"
                                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm font-mono uppercase"
                                            disabled={applyingCoupon}
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={applyingCoupon || !couponCode}
                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {applyingCoupon ? 'Applying...' : 'Apply'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Enter a valid coupon code to get instant wallet credit
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Offers Modal */}
                <AnimatePresence>
                    {showCouponsList && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl max-h-[80vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <FaMoneyBillWave className="text-emerald-600" /> Available Offers
                                    </h3>
                                    <button onClick={() => setShowCouponsList(false)} className="text-slate-400 hover:text-slate-600">
                                        <FaTimes size={20} />
                                    </button>
                                </div>

                                {loadingCoupons ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                    </div>
                                ) : availableCoupons.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        No active coupons available for you right now.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availableCoupons.map((coupon) => (
                                            <div
                                                key={coupon.code}
                                                onClick={() => {
                                                    setCouponCode(coupon.code);
                                                    setShowCouponsList(false);
                                                    if (!showCouponSection) setShowCouponSection(true);
                                                }}
                                                className="border rounded-xl p-4 hover:border-emerald-500 cursor-pointer transition-colors bg-slate-50 group"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full text-xs tracking-wider border border-emerald-200">
                                                        {coupon.code}
                                                    </span>
                                                    <span className="font-bold text-slate-900">₹{coupon.amount}</span>
                                                </div>
                                                <h4 className="font-semibold text-slate-800 mb-1">{coupon.title}</h4>
                                                <p className="text-xs text-slate-500">{coupon.description}</p>
                                                <p className="text-[10px] text-slate-400 mt-2">
                                                    Valid until: {new Date(coupon.validTo).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transactions History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FaHistory className="text-emerald-600" />
                        {getTranslatedText("Recent Transactions")}
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-slate-100 rounded-xl p-4 h-20 animate-pulse" />
                            ))}
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((tx, index) => {
                                const isDebit = tx.type === 'DEBIT';

                                let label = getTranslatedText("Completed Pickup");
                                let icon = isDebit ? <FaArrowUp /> : <FaArrowDown />;

                                switch (tx.category) {
                                    case 'COUPON_CREDIT':
                                        label = `Coupon Applied${tx.couponCode ? ': ' + tx.couponCode : ''}`;
                                        icon = (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                        );
                                        break;
                                    case 'RECHARGE': label = getTranslatedText("Recharge"); break;
                                    case 'COMMISSION': label = getTranslatedText("Commission"); break;
                                    case 'WITHDRAWAL': label = getTranslatedText("Withdrawal"); break;
                                    case 'PAYMENT_RECEIVED': label = getTranslatedText("Payment Received"); break;
                                    case 'PAYMENT_SENT': label = getTranslatedText("Payment Sent"); break;
                                    case 'REFUND': label = getTranslatedText("Refund"); break;
                                    case 'REFERRAL_BONUS': label = getTranslatedText("Bonus"); break;
                                    default: label = tx.description || getTranslatedText("Transaction");
                                }

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * index }}
                                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.category === 'COUPON_CREDIT' ? 'bg-purple-100 text-purple-600' :
                                                isDebit ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {label}
                                                    {tx.orderId && <span className="text-xs text-slate-400 ml-1">#{typeof tx.orderId === 'string' ? tx.orderId.slice(-4) : '...'}</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatDate(tx.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${isDebit ? 'text-red-500' : 'text-emerald-600'
                                                }`}>
                                                {isDebit ? '-' : '+'}₹{tx.amount?.toLocaleString()}
                                            </p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                                tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                            <FaExclamationCircle className="mx-auto text-slate-400 mb-3" size={40} />
                            <p className="text-slate-500">{getTranslatedText("No transactions yet")}</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Add Money Modal */}
            <AnimatePresence>
                {showAddMoney && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FaMoneyBillWave className="text-emerald-600" /> {getTranslatedText("Add Funds")}
                                </h3>
                                <button onClick={() => setShowAddMoney(false)} className="text-slate-400 hover:text-slate-600">
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddMoney}>
                                <div className="mb-6">
                                    <label className="block text-sm text-slate-500 mb-2">{getTranslatedText("Enter Amount to Add")}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 font-bold text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 text-lg font-bold focus:border-emerald-500 outline-none"
                                            placeholder="1000"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        {[500, 1000, 2000].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setAmount(val.toString())}
                                                className="bg-slate-100 text-xs px-3 py-1 rounded-full text-slate-600 hover:bg-slate-200 border border-slate-200"
                                            >
                                                ₹{val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? getTranslatedText("Processing...") : getTranslatedText("Add Funds")}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {showWithdraw && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FaUniversity className="text-emerald-600" /> {getTranslatedText("Withdraw Funds")}
                                </h3>
                                <button onClick={() => setShowWithdraw(false)} className="text-slate-400 hover:text-slate-600">
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleWithdraw}>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-500 mb-2">{getTranslatedText("Withdrawal Amount")}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 font-bold text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={withdrawDetails.amount}
                                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, amount: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 text-lg font-bold focus:border-emerald-500 outline-none"
                                            placeholder="1000"
                                            min="100"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{getTranslatedText("Available")}: ₹{balance.available}</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm text-slate-500 mb-2">{getTranslatedText("Payment Method")}</label>
                                    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawDetails({ ...withdrawDetails, method: 'UPI' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${withdrawDetails.method === 'UPI' ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}
                                        >
                                            UPI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawDetails({ ...withdrawDetails, method: 'BANK_TRANSFER' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${withdrawDetails.method === 'BANK_TRANSFER' ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}
                                        >
                                            Bank Transfer
                                        </button>
                                    </div>
                                </div>

                                {withdrawDetails.method === 'UPI' ? (
                                    <div className="mb-6">
                                        <label className="block text-sm text-slate-500 mb-2">{getTranslatedText("UPI ID")}</label>
                                        <input
                                            type="text"
                                            value={withdrawDetails.upiId}
                                            onChange={(e) => setWithdrawDetails({ ...withdrawDetails, upiId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:border-emerald-500 outline-none"
                                            placeholder="username@okaxis"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm text-slate-500 mb-2">Account Holder Name</label>
                                            <input
                                                type="text"
                                                value={withdrawDetails.accountHolderName}
                                                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountHolderName: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:border-emerald-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-500 mb-2">Account Number</label>
                                            <input
                                                type="text"
                                                value={withdrawDetails.accountNumber}
                                                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountNumber: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:border-emerald-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-500 mb-2">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={withdrawDetails.ifscCode}
                                                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, ifscCode: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:border-emerald-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? getTranslatedText("Processing...") : getTranslatedText("Request Withdrawal")}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Nav is handled by the layout, but we ensure spacing is active */}
            <div className="md:hidden">
                <ScrapperBottomNav />
            </div>
        </div>
    );
};

export default ScrapperWallet;
