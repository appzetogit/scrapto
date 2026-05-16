import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoLocateOutline, IoLocationOutline } from 'react-icons/io5';
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
        "Enter valid vehicle number",
        "City",
        "Location",
        "Get Current Location",
        "Location updated",
        "Failed to get location",
        "Updating location..."
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        city: '',
        liveLocation: null
    });
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState('');
    const [error, setError] = useState('');

    const cityInputRef = useRef(null);
    const autocompleteRef = useRef(null);

    // vehicle types options
    const vehicleTypes = ['bike', 'truck'];

    const initAutocomplete = useCallback(() => {
        if (!cityInputRef.current || !window.google?.maps?.places) return;
        if (autocompleteRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current, {
            types: ['(cities)'],
            componentRestrictions: { country: 'in' },
            fields: ['address_components', 'geometry', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            const cityComponent = place.address_components?.find(
                (c) => c.types.includes('locality') || c.types.includes('administrative_area_level_2')
            );
            const selectedCity = cityComponent?.long_name || place.name || '';
            
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();

            setFormData(prev => ({
                ...prev,
                city: selectedCity,
                liveLocation: lat && lng ? {
                    type: 'Point',
                    coordinates: [lng, lat]
                } : prev.liveLocation
            }));

            if (lat && lng) {
                setLocationStatus(getTranslatedText("Location updated from city"));
                setTimeout(() => setLocationStatus(''), 3000);
            }
        });

        autocompleteRef.current = autocomplete;
    }, [getTranslatedText]);

    useEffect(() => {
        if (isOpen) {
            if (window.google?.maps?.places) {
                initAutocomplete();
            } else {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                if (apiKey) {
                    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
                    if (!existingScript) {
                        const script = document.createElement('script');
                        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                        script.async = true;
                        script.onload = initAutocomplete;
                        document.head.appendChild(script);
                    } else {
                        existingScript.addEventListener('load', initAutocomplete);
                    }
                }
            }
        }
    }, [isOpen, initAutocomplete]);

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({
                name: initialData.name || '',
                vehicleType: initialData.vehicleInfo?.type || 'bike',
                vehicleNumber: initialData.vehicleInfo?.number || '',
                city: initialData.city || '',
                liveLocation: initialData.liveLocation || null
            });
            setLocationStatus('');
        }
    }, [initialData, isOpen]);

    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            setError(getTranslatedText("Geolocation is not supported by your browser"));
            return;
        }

        setFetchingLocation(true);
        setLocationStatus(getTranslatedText("Updating location..."));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    liveLocation: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    }
                }));

                // Reverse Geocode to get City name
                if (window.google?.maps?.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            const cityComponent = results[0].address_components?.find(
                                (c) => c.types.includes('locality') || c.types.includes('administrative_area_level_2')
                            );
                            if (cityComponent) {
                                setFormData(prev => ({
                                    ...prev,
                                    city: cityComponent.long_name
                                }));
                            }
                        }
                    });
                }

                setFetchingLocation(false);
                setLocationStatus(getTranslatedText("Location updated"));
                setTimeout(() => setLocationStatus(''), 3000);
            },
            (err) => {
                console.error("Location error:", err);
                setFetchingLocation(false);
                setLocationStatus('');
                setError(getTranslatedText("Failed to get location"));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

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
        if (!formData.city.trim()) {
            setError(getTranslatedText("City is required"));
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
                },
                city: formData.city,
                liveLocation: formData.liveLocation
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
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]"
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

                                {/* City */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        {getTranslatedText("City")} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={cityInputRef}
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800"
                                        placeholder="Enter your city"
                                    />
                                </div>

                                {/* Location */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        {getTranslatedText("Location")}
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={handleFetchLocation}
                                            disabled={fetchingLocation}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-all disabled:opacity-50"
                                        >
                                            {fetchingLocation ? (
                                                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <IoLocateOutline size={18} />
                                            )}
                                            {getTranslatedText("Get Current Location")}
                                        </button>
                                        
                                        {locationStatus && (
                                            <p className={`text-[10px] font-medium text-center ${locationStatus === getTranslatedText("Location updated") ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {locationStatus}
                                            </p>
                                        )}
                                        
                                        {formData.liveLocation && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-500">
                                                <IoLocationOutline size={12} className="text-emerald-500" />
                                                <span>Lat: {formData.liveLocation.coordinates[1].toFixed(4)}, Lng: {formData.liveLocation.coordinates[0].toFixed(4)}</span>
                                            </div>
                                        )}
                                    </div>
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
