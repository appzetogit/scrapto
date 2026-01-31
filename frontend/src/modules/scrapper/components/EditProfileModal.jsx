import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { scrapperProfileAPI } from '../../shared/utils/api';
import { useAuth } from '../../shared/context/AuthContext';

const EditProfileModal = ({ isOpen, onClose, initialData, onSuccess }) => {
    const staticTexts = [
        "Edit Profile",
        "Update your personal and vehicle details",
        "Name",
        "Vehicle Type",
        "Vehicle Number",
        "Save Changes",
        "Cancel",
        "Saving...",
        "Bike",
        "Truck",
        "Van",
        "Three Wheeler",
        "Other",
        "Profile updated successfully",
        "Failed to update profile",
        "Enter valid vehicle number"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        vehicleType: 'bike',
        vehicleNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // vehicle types options
    const vehicleTypes = ['bike', 'truck'];

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                vehicleType: initialData.vehicleInfo?.type || 'bike',
                vehicleNumber: initialData.vehicleInfo?.number || ''
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic Validation
        if (!formData.name.trim()) {
            setError(getTranslatedText("Name is required"));
            setLoading(false);
            return;
        }
        if (!formData.vehicleNumber.trim()) {
            setError(getTranslatedText("Enter valid vehicle number"));
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                vehicleInfo: {
                    type: formData.vehicleType,
                    number: formData.vehicleNumber.toUpperCase() // Standardize to uppercase
                }
            };

            const response = await scrapperProfileAPI.updateMyProfile(payload);

            if (response.success) {
                // Success
                onSuccess(response.data.scrapper); // Pass back updated object
                onClose();
            } else {
                setError(response.message || getTranslatedText("Failed to update profile"));
            }
        } catch (err) {
            console.error('Update profile error:', err);
            setError(err.message || getTranslatedText("Failed to update profile"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{getTranslatedText("Edit Profile")}</h3>
                                    <p className="text-xs text-slate-500">{getTranslatedText("Update your personal and vehicle details")}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        {getTranslatedText("Name")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800"
                                        placeholder="John Doe"
                                    />
                                </div>

                                {/* Vehicle Type */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        {getTranslatedText("Vehicle Type")}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {vehicleTypes.map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, vehicleType: type })}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${formData.vehicleType === type
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className="capitalize">{type.replace('_', ' ')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Vehicle Number */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        {getTranslatedText("Vehicle Number")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vehicleNumber}
                                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800 uppercase"
                                        placeholder="UP14 AB 1234"
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-4 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {getTranslatedText("Cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? getTranslatedText("Saving...") : getTranslatedText("Save Changes")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;
