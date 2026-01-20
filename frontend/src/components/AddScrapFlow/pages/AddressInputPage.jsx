import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const AddressInputPage = () => {
    const staticTexts = [
        "Pickup Address",
        "Step 4 of 5",
        "Getting Location...",
        "Get My Current Location",
        "Location Detected",
        "Latitude:",
        "Longitude:",
        "Pickup Address *",
        "Enter your complete pickup address (House/Flat No, Street, Landmark, City, Pincode)",
        "Please provide a detailed address so the scrapper can easily find your location",
        "Request Summary",
        "Categories:",
        "selected",
        "Images:",
        "uploaded",
        "Weight:",
        "kg",
        "Continue to Confirmation",
        "Please allow location access or enter manually",
        "Enter your pickup address to continue",
        "Geolocation is not supported by your browser",
        "Location permission denied. Please enable location access in your browser settings.",
        "Location information is unavailable.",
        "Location request timed out.",
        "An unknown error occurred.",
        "Please enter your pickup address",
        "Please allow location access or enter your location manually"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const navigate = useNavigate();
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [weightData, setWeightData] = useState(null);

    // Load data from sessionStorage
    useEffect(() => {
        const storedImages = sessionStorage.getItem('uploadedImages');
        const storedCategories = sessionStorage.getItem('selectedCategories');
        const storedWeight = sessionStorage.getItem('weightData');
        const storedAddress = sessionStorage.getItem('addressData');

        if (storedImages) setUploadedImages(JSON.parse(storedImages));
        if (storedCategories) setSelectedCategories(JSON.parse(storedCategories));
        if (storedWeight) setWeightData(JSON.parse(storedWeight));

        // Load saved address if exists
        if (storedAddress) {
            const addressData = JSON.parse(storedAddress);
            setAddress(addressData.address || '');
            setCoordinates(addressData.coordinates || null);
        }

        // Redirect if missing required data
        if (!storedCategories || !storedImages || !storedWeight) {
            navigate('/add-scrap/category');
        }
    }, [navigate]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError(getTranslatedText('Geolocation is not supported by your browser'));
            return;
        }

        setIsGettingLocation(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Location detected:", position.coords);
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCoordinates(coords);
                setIsGettingLocation(false);

                // Reverse geocode to get address (optional - using a simple format)
                // In production, you can use Google Geocoding API
                setAddress(`Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
            },
            (error) => {
                console.error("Geolocation Error:", error);
                setIsGettingLocation(false);

                // Use standard error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        setLocationError(getTranslatedText('Browser blocked location. Please click the lock icon in your URL bar and select "Allow" for Location.'));
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        setLocationError(getTranslatedText('Location information is unavailable.'));
                        break;
                    case 3: // TIMEOUT
                        setLocationError(getTranslatedText('Location request timed out.'));
                        break;
                    default:
                        // Log the specific unknown error message for debugging
                        console.error("Unknown location error:", error.message);
                        setLocationError(getTranslatedText('An unknown error occurred.'));
                        break;
                }
            },
            {
                enableHighAccuracy: false, // Changed to false for faster, more reliable Wi-Fi/IP location
                timeout: 30000,            // Increased timeout to 30 seconds
                maximumAge: 0
            }
        );
    };

    const handleContinue = () => {
        if (!address.trim()) {
            alert(getTranslatedText('Please enter your pickup address'));
            return;
        }

        if (!coordinates) {
            alert(getTranslatedText('Please allow location access or enter your location manually'));
            return;
        }

        // Save address data to sessionStorage
        const addressData = {
            address: address.trim(),
            coordinates: coordinates,
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('addressData', JSON.stringify(addressData));

        // Navigate to confirmation page
        navigate('/add-scrap/confirm');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen w-full flex flex-col"
            style={{ backgroundColor: '#f4ebe2' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-6 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
                <button
                    onClick={() => navigate('/add-scrap/weight')}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h2
                    className="text-lg md:text-2xl font-bold"
                    style={{ color: '#2d3748' }}
                >
                    {getTranslatedText("Pickup Address")}
                </h2>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Progress Indicator */}
            <div className="px-3 md:px-6 pt-3 md:pt-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
                        <motion.div
                            initial={{ width: '75%' }}
                            animate={{ width: '87.5%' }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: '#64946e' }}
                        />
                    </div>
                    <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 4 of 5")}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
                {/* Location Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 md:mb-6"
                >
                    <button
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full py-4 rounded-xl font-semibold text-base shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                    >
                        {isGettingLocation ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                                />
                                {getTranslatedText("Getting Location...")}
                            </>
                        ) : (
                            <>
                                <FaLocationArrow />
                                {getTranslatedText("Get My Current Location")}
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Location Error */}
                {locationError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 rounded-xl"
                        style={{ backgroundColor: '#fee2e2' }}
                    >
                        <p className="text-sm" style={{ color: '#dc2626' }}>
                            {locationError}
                        </p>
                    </motion.div>
                )}

                {/* Coordinates Display */}
                {coordinates && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <FaMapMarkerAlt style={{ color: '#64946e' }} />
                            <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                                {getTranslatedText("Location Detected")}
                            </p>
                        </div>
                        <p className="text-xs" style={{ color: '#718096' }}>
                            {getTranslatedText("Latitude:")} {coordinates.lat.toFixed(6)}
                        </p>
                        <p className="text-xs" style={{ color: '#718096' }}>
                            {getTranslatedText("Longitude:")} {coordinates.lng.toFixed(6)}
                        </p>
                    </motion.div>
                )}

                {/* Address Input */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-4 md:p-6 mb-4"
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <label className="block text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Pickup Address *")}
                    </label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={getTranslatedText("Enter your complete pickup address (House/Flat No, Street, Landmark, City, Pincode)")}
                        rows={5}
                        className="w-full py-3 px-4 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none text-sm md:text-base"
                        style={{
                            borderColor: address ? '#64946e' : 'rgba(100, 148, 110, 0.3)',
                            color: '#2d3748',
                            backgroundColor: '#f9f9f9'
                        }}
                    />
                    <p className="text-xs mt-2" style={{ color: '#718096' }}>
                        {getTranslatedText("Please provide a detailed address so the scrapper can easily find your location")}
                    </p>
                </motion.div>

                {/* Summary Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl p-4 md:p-6"
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <h3 className="text-base font-bold mb-3" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Request Summary")}
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#718096' }}>{getTranslatedText("Categories:")}</span>
                            <span className="font-semibold" style={{ color: '#2d3748' }}>
                                {selectedCategories.length} {getTranslatedText("selected")}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#718096' }}>{getTranslatedText("Images:")}</span>
                            <span className="font-semibold" style={{ color: '#2d3748' }}>
                                {uploadedImages.length} {getTranslatedText("uploaded")}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#718096' }}>{getTranslatedText("Weight:")}</span>
                            <span className="font-semibold" style={{ color: '#2d3748' }}>
                                {weightData?.weight || 0} {getTranslatedText("kg")}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer with Continue Button - Fixed on Mobile */}
            <div
                className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t z-50"
                style={{
                    borderColor: 'rgba(100, 148, 110, 0.2)',
                    backgroundColor: '#f4ebe2'
                }}
            >
                {address && coordinates ? (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleContinue}
                        className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{ backgroundColor: '#64946e' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8263'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#64946e'}
                    >
                        {getTranslatedText("Continue to Confirmation")}
                    </motion.button>
                ) : (
                    <p
                        className="text-xs md:text-sm text-center"
                        style={{ color: '#718096' }}
                    >
                        {!coordinates
                            ? getTranslatedText('Please allow location access or enter manually')
                            : getTranslatedText('Enter your pickup address to continue')}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default AddressInputPage;
