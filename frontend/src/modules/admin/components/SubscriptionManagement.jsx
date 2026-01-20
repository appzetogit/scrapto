import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../shared/utils/api';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const SubscriptionManagement = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: '',
        durationType: 'monthly',
        features: '',
        maxPickups: '',
        priority: 0,
        isActive: true,
        isPopular: false
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllSubscriptionPlans();
            if (response.success) {
                setPlans(response.data.plans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description || '',
                price: plan.price,
                duration: plan.duration,
                durationType: plan.durationType,
                features: plan.features.join('\n'), // Join array for textarea
                maxPickups: plan.maxPickups || '',
                priority: plan.priority || 0,
                isActive: plan.isActive,
                isPopular: plan.isPopular || false
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                duration: '',
                durationType: 'monthly',
                features: '',
                maxPickups: '',
                priority: 0,
                isActive: true,
                isPopular: false
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Process features from textarea (split by newline)
            const processedData = {
                ...formData,
                features: formData.features.split('\n').filter(f => f.trim() !== ''),
                price: Number(formData.price),
                duration: Number(formData.duration),
                priority: Number(formData.priority),
                maxPickups: formData.maxPickups ? Number(formData.maxPickups) : null
            };

            if (editingPlan) {
                await adminAPI.updateSubscriptionPlan(editingPlan._id, processedData);
                toast.success('Plan updated successfully');
            } else {
                await adminAPI.createSubscriptionPlan(processedData);
                toast.success('Plan created successfully');
            }
            setShowModal(false);
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            toast.error('Failed to save plan');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await adminAPI.deleteSubscriptionPlan(id);
                toast.success('Plan deleted successfully');
                fetchPlans();
            } catch (error) {
                console.error('Error deleting plan:', error);
                toast.error('Failed to delete plan. Try deactivating instead.');
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading plans...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition"
                >
                    <FaPlus /> create New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <motion.div
                        key={plan._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-xl shadow-md overflow-hidden border-t-4 ${plan.isActive ? 'border-emerald-500' : 'border-gray-300'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {plan.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {plan.isPopular && <span className="ml-2 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Popular</span>}
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-600">₹{plan.price}</p>
                                    <p className="text-sm text-gray-500">/{plan.duration} {plan.durationType === 'monthly' ? 'Month(s)' : plan.durationType}</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>

                            <div className="mb-4">
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Features:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {plan.features.slice(0, 3).map((f, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <FaCheck className="text-emerald-500 text-xs" /> {f}
                                        </li>
                                    ))}
                                    {plan.features.length > 3 && <li className="text-xs text-gray-500">+{plan.features.length - 3} more</li>}
                                </ul>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                                <button
                                    onClick={() => handleOpenModal(plan)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDelete(plan._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Count)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration Type</label>
                                <select
                                    value={formData.durationType}
                                    onChange={e => setFormData({ ...formData, durationType: e.target.value })}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Features (One per line)</label>
                                <textarea
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                                    rows="4"
                                    placeholder="Unlimited access&#10;Premium support"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular}
                                        onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                                </label>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                                >
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManagement;
