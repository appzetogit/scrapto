import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus,
    FaTrash,
    FaCheckCircle,
    FaTimesCircle,
    FaUsers,
    FaTruck,
    FaTicketAlt,
    FaSearch,
    FaCalendarAlt,
    FaFilter
} from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import toast from 'react-hot-toast';

const CreateCouponModal = ({ onClose, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        amount: '',
        applicableRole: 'ALL',
        usageType: 'SINGLE_USE_PER_USER',
        limit: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!formData.code || !formData.amount || !formData.validTo) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                code: formData.code.toUpperCase(),
                amount: Number(formData.amount),
                limit: Number(formData.limit)
            };

            const customAdminAPI = {
                createCoupon: (data) => adminAPI.request('/admin/coupons', {
                    method: 'POST',
                    body: JSON.stringify(data)
                })
            }

            const response = await customAdminAPI.createCoupon(payload);

            if (response.success) {
                toast.success('Coupon created successfully');
                onCreated();
                onClose();
            }
        } catch (error) {
            console.error('Create Coupon Error:', error);
            toast.error(error.message || 'Failed to create coupon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">Create New Coupon</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimesCircle size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="e.g. WELCOME50"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="e.g. 50"
                                min="1"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title / Description</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. New User Bonus"
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Applicable For</label>
                            <select
                                name="applicableRole"
                                value={formData.applicableRole}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="ALL">All Users</option>
                                <option value="USER">Users Only</option>
                                <option value="SCRAPPER">Scrappers Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Usage Type</label>
                            <select
                                name="usageType"
                                value={formData.usageType}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="SINGLE_USE_PER_USER">Single Use Per User</option>
                                <option value="LIMITED">Limited Global Usage</option>
                                <option value="UNLIMITED">Unlimited</option>
                            </select>
                        </div>
                    </div>

                    {formData.usageType === 'LIMITED' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Total Limit</label>
                            <input
                                type="number"
                                name="limit"
                                value={formData.limit}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Valid From</label>
                            <input
                                type="date"
                                name="validFrom"
                                value={formData.validFrom}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Valid To</label>
                            <input
                                type="date"
                                name="validTo"
                                value={formData.validTo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const CouponsList = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            // We'll add this specific endpoint to adminAPI later, or use generic request
            const customAdminAPI = {
                getAllCoupons: () => adminAPI.request('/admin/coupons'),
                deleteCoupon: (id) => adminAPI.request(`/admin/coupons/${id}`, { method: 'DELETE' }),
                toggleStatus: (id) => adminAPI.request(`/admin/coupons/${id}/status`, { method: 'PATCH' })
            }

            const response = await customAdminAPI.getAllCoupons();
            if (response.success) {
                setCoupons(response.data);
            }
        } catch (error) {
            console.error('Fetch Coupons Error:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleToggleStatus = async (id) => {
        try {
            const customAdminAPI = {
                toggleStatus: (id) => adminAPI.request(`/admin/coupons/${id}/status`, { method: 'PATCH' })
            }
            await customAdminAPI.toggleStatus(id);
            fetchCoupons();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            const customAdminAPI = {
                deleteCoupon: (id) => adminAPI.request(`/admin/coupons/${id}`, { method: 'DELETE' })
            }
            await customAdminAPI.deleteCoupon(id);
            fetchCoupons();
            toast.success('Coupon deleted');
        } catch (error) {
            toast.error(error.message || 'Failed to delete coupon');
        }
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Coupon Management</h1>
                    <p className="text-gray-500">Create and manage promotional coupons</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                    <FaPlus />
                    Create Coupon
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by code or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
                />
            </div>

            {/* Coupons Grid/List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-gray-300 mb-4">
                        <FaTicketAlt size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No coupons found</h3>
                    <p className="text-gray-500">Create a new coupon to get started</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCoupons.map((coupon) => (
                        <motion.div
                            key={coupon._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-white rounded-2xl p-6 shadow-sm border transaction-all ${coupon.isActive ? 'border-gray-100' : 'border-red-100 bg-red-50/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                                        {coupon.code}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800 mt-2">{coupon.title}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(coupon._id)}
                                        className={`p-2 rounded-lg transition-colors ${coupon.isActive
                                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        title={coupon.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {coupon.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon._id)}
                                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                                    <span>Credit Amount</span>
                                    <span className="font-bold text-gray-900">₹{coupon.amount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FaUsers className="text-gray-400" />
                                        <span>Role</span>
                                    </div>
                                    <span className="capitalize">{coupon.applicableRole.toLowerCase()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FaTicketAlt className="text-gray-400" />
                                        <span>Usage Type</span>
                                    </div>
                                    <span className="capitalize text-xs bg-gray-100 px-2 py-0.5 rounded">
                                        {coupon.usageType.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        <span>Valid Until</span>
                                    </div>
                                    <span>{new Date(coupon.validTo).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span>Used Count</span>
                                    <span className="font-bold">{coupon.usedCount} {coupon.limit > 0 ? `/ ${coupon.limit}` : ''}</span>
                                </div>
                            </div>

                            {!coupon.isActive && (
                                <div className="mt-4 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded text-center">
                                    Inactive
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateCouponModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreated={fetchCoupons}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CouponsList;
