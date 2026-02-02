import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyCheckAlt, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, FaClock, FaUniversity, FaUser } from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import toast from 'react-hot-toast';

const WithdrawalRequests = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, PROCESSED, REJECTED
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
    const [actionNote, setActionNote] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    useEffect(() => {
        fetchWithdrawals();
    }, [filterStatus, page]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const query = `page=${page}&limit=10${filterStatus !== 'ALL' ? `&status=${filterStatus}` : ''}`;
            const response = await adminAPI.getAllWithdrawals(query);
            if (response.success) {
                setWithdrawals(response.data.withdrawals);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch withdrawals');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        if (!selectedWithdrawal || !actionType) return;

        setProcessingAction(true);
        try {
            const status = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            // Status APPROVED usually means processed in this context if we want to confirm transfer
            // Or we treat APPROVED as PROCESSED. Let's use PROCESSED for successful transfer
            // But usually admin marks as PROCESSED after bank transfer.
            // Let's stick to PROCESSED for approval.

            const payload = {
                status: actionType === 'APPROVE' ? 'PROCESSED' : 'REJECTED',
                remarks: actionNote,
                transactionId: actionType === 'APPROVE' ? transactionId : null
            };

            await adminAPI.updateWithdrawalStatus(selectedWithdrawal._id, payload);
            toast.success(`Withdrawal ${payload.status.toLowerCase()} successfully`);
            setSelectedWithdrawal(null);
            setActionType(null);
            fetchWithdrawals();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Action failed');
        } finally {
            setProcessingAction(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FaMoneyCheckAlt className="text-emerald-600" /> Withdrawal Requests
                    </h1>
                    <p className="text-slate-500 text-sm">Manage user and scrapper withdrawal requests</p>
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-emerald-500 outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSED">Processed</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                </div>
            ) : withdrawals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-slate-100">
                    <FaMoneyCheckAlt className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-700">No withdrawal requests found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                                    <th className="p-4 font-semibold">User Details</th>
                                    <th className="p-4 font-semibold">Amount</th>
                                    <th className="p-4 font-semibold">Bank Details</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Requested At</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {withdrawals.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <FaUser size={12} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">
                                                        {item.user?.name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 capitalize">
                                                        {item.userType} • {item.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-slate-800">₹{item.amount?.toLocaleString()}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-600 space-y-1">
                                                {item.bankDetails?.upiId ? (
                                                    <p className="flex items-center gap-1">
                                                        <span className="font-semibold">UPI:</span> {item.bankDetails.upiId}
                                                    </p>
                                                ) : item.bankDetails?.accountNumber ? (
                                                    <>
                                                        <p><span className="font-semibold">Bank:</span> {item.bankDetails.accountNumber}</p>
                                                        <p><span className="font-semibold">IFSC:</span> {item.bankDetails.ifscCode}</p>
                                                        <p><span className="font-semibold">Name:</span> {item.bankDetails.accountHolderName}</p>
                                                    </>
                                                ) : (
                                                    <span>N/A</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                ${item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    item.status === 'PROCESSED' || item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">
                                            {formatDate(item.createdAt)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {item.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedWithdrawal(item);
                                                            setActionType('APPROVE');
                                                            setTransactionId('');
                                                            setActionNote('');
                                                        }}
                                                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                                        title="Approve / Process"
                                                    >
                                                        <FaCheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedWithdrawal(item);
                                                            setActionType('REJECT');
                                                            setActionNote('');
                                                        }}
                                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <FaTimesCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                            {item.status !== 'PENDING' && (
                                                <span className="text-xs text-slate-400 italic">
                                                    Action taken
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 flex justify-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1 text-sm text-slate-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Action Popup */}
            <AnimatePresence>
                {selectedWithdrawal && actionType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
                        >
                            <h3 className={`text-xl font-bold mb-4 ${actionType === 'APPROVE' ? 'text-green-600' : 'text-red-600'}`}>
                                {actionType === 'APPROVE' ? 'Process Withdrawal' : 'Reject Withdrawal'}
                            </h3>

                            <form onSubmit={handleAction} className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Amount:</span>
                                        <span className="font-bold">₹{selectedWithdrawal.amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">User:</span>
                                        <span className="font-medium">{selectedWithdrawal.user?.name}</span>
                                    </div>
                                    {selectedWithdrawal.bankDetails?.accountNumber && (
                                        <div className="pt-2 border-t border-slate-200 mt-2">
                                            <p className="font-semibold text-xs text-slate-500 mb-1">Bank Details:</p>
                                            <p>Acct: {selectedWithdrawal.bankDetails.accountNumber}</p>
                                            <p>IFSC: {selectedWithdrawal.bankDetails.ifscCode}</p>
                                        </div>
                                    )}
                                </div>

                                {actionType === 'APPROVE' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Bank Transaction ID
                                        </label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:border-green-500 outline-none"
                                            placeholder="e.g. UTR123456789"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {actionType === 'APPROVE' ? 'Remarks (Optional)' : 'Rejection Reason'}
                                    </label>
                                    <textarea
                                        value={actionNote}
                                        onChange={(e) => setActionNote(e.target.value)}
                                        required={actionType === 'REJECT'}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none"
                                        rows="3"
                                        placeholder={actionType === 'APPROVE' ? "Any notes..." : "Reason for rejection..."}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedWithdrawal(null);
                                            setActionType(null);
                                        }}
                                        className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingAction}
                                        className={`flex-1 py-2 rounded-xl text-white font-bold transition-colors
                                            ${actionType === 'APPROVE'
                                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                                                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'}`}
                                    >
                                        {processingAction ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Transfer' : 'Reject Request'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WithdrawalRequests;
