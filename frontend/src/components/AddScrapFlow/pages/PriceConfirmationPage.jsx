import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/shared/context/AuthContext';
import { checkAndProcessMilestone } from '../../../modules/shared/utils/referralUtils';
import { orderAPI } from '../../../modules/shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { FaCalendarAlt, FaClock, FaBolt, FaRegCalendarAlt } from 'react-icons/fa';
import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';
import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

const PriceConfirmationPage = () => {
  const staticTexts = [
    "Confirm & Apply",
    "Step 5 of 5",
    "Request Summary",
    "Categories:",
    "Images:",
    "Weight:",
    "kg",
    "(Auto-detected)",
    "Pickup Address:",
    "📍 Location:",
    "Price Breakdown:",
    "Estimated Payout:",
    "for",
    "Additional Notes (Optional)",
    "Add any special instructions or details about your scrap...",
    "Preferred Pickup Date & Time",
    "Select a day (today or upcoming days)",
    "Or type a specific date",
    "Select a time window",
    "Or type a specific time",
    "You selected:",
    "Submitting Request...",
    "Apply for Pickup -",
    "By applying, you agree to our terms and conditions",
    "Please select a pickup date and time slot before applying.",
    "Please login to place a pickup request.",
    "Failed to submit request. Please try again.",
    "Address not provided",
    "Plastic",
    "Metal",
    "Paper",
    "Electronics",
    "Copper",
    "Aluminium",
    "Steel",
    "Brass",
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM",
    "5:00 PM - 7:00 PM",
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    "Select Date", "Select Time", "Selected Time",
    "When for?", "Right Now", "Schedule", "Scrapper will come immediately"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickupMode, setPickupMode] = useState('scheduled'); // 'immediate' | 'scheduled'
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [weightData, setWeightData] = useState(null);
  const [notes, setNotes] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // ISO date string
  const [selectedSlot, setSelectedSlot] = useState("10:00");
  const [marketPrices, setMarketPrices] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [addressData, setAddressData] = useState(null);

  // Load all data from sessionStorage
  useEffect(() => {
    const storedCategories = sessionStorage.getItem('selectedCategories');
    const storedImages = sessionStorage.getItem('uploadedImages');
    const storedWeight = sessionStorage.getItem('weightData');

    const storedAddress = sessionStorage.getItem('addressData');

    if (storedCategories) {
      setSelectedCategories(JSON.parse(storedCategories));
    }
    if (storedImages) {
      setUploadedImages(JSON.parse(storedImages));
    }
    if (storedWeight) {
      const weight = JSON.parse(storedWeight);
      setWeightData(weight);
      setEstimatedPayout(weight.estimatedPayout || 0);
    }
    if (storedAddress) {
      setAddressData(JSON.parse(storedAddress));
    }

    // Redirect if missing required data
    if (!storedCategories || !storedImages || !storedWeight || !storedAddress) {
      navigate('/add-scrap/category');
    }
  }, [navigate]);

  // Fetch market prices from backend
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const { publicAPI } = await import('../../../modules/shared/utils/api');
        const response = await publicAPI.getPrices();

        if (response.success && response.data?.prices) {
          // Convert prices array to object for easy lookup
          const pricesMap = {};
          response.data.prices.forEach(price => {
            pricesMap[price.category] = price.pricePerKg;
          });
          setMarketPrices(pricesMap);
        } else {
          // Fallback to default prices if API fails
          setMarketPrices({
            'Plastic': 45,
            'Metal': 180,
            'Paper': 12,
            'Electronics': 85,
            'Copper': 650,
            'Aluminium': 180,
            'Steel': 35,
            'Brass': 420,
          });
        }
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
        // Fallback to default prices
        setMarketPrices({
          'Plastic': 45,
          'Metal': 180,
          'Paper': 12,
          'Electronics': 85,
          'Copper': 650,
          'Aluminium': 180,
          'Steel': 35,
          'Brass': 420,
        });
      }
    };

    fetchMarketPrices();
  }, []);

  // Helper: generate next 7 days (including today)
  const dayOptions = useMemo(() => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const iso = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const display = `${getTranslatedText(dayName)}, ${date.getDate()}`;
      days.push({ iso, dayName, display });
    }
    return days;
  }, [getTranslatedText]);

  const mapCategoryToBackend = (cat) => {
    const id = (cat.id || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    if (id.includes('metal') || name === 'metal') return 'metal';
    if (id.includes('plastic') || name === 'plastic') return 'plastic';
    if (id.includes('paper') || name === 'paper') return 'paper';
    if (id.includes('electronic') || name === 'electronics' || name === 'electronic') return 'electronic';
    if (id.includes('glass') || name === 'glass') return 'glass';
    return 'other';
  };

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }

    console.log('handleSubmit called');
    setIsSubmitting(true);

    if (pickupMode === 'scheduled' && (!selectedDate || !selectedSlot)) {
      alert(getTranslatedText('Please select a pickup date and time slot before applying.'));
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      alert(getTranslatedText('Please login to place a pickup request.'));
      setIsSubmitting(false);
      return;
    }

    let pickupSlotData = {};
    const dateObj = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (pickupMode === 'immediate') {
      const dayName = dayNames[dateObj.getDay()];
      const isoDate = dateObj.toISOString().split('T')[0];
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

      pickupSlotData = {
        date: isoDate,
        dayName,
        slot: "Immediate"
      };
      // We can also set preferredTime for display consistency, though it's technically "Immediate"
    } else {
      const scheduledDateObj = new Date(selectedDate);
      const dayName = dayNames[scheduledDateObj.getDay()];
      pickupSlotData = {
        date: selectedDate,
        dayName,
        slot: selectedSlot
      };
    }

    const totalWeight = Number(weightData?.weight || 0);
    const itemCount = Math.max(selectedCategories.length, 1);
    const weightPerItem = totalWeight > 0 ? totalWeight / itemCount : 0;

    const scrapItems = selectedCategories.map((cat) => {
      const category = mapCategoryToBackend(cat);
      const rate = cat.price || marketPrices[cat.name] || 0;
      const total = weightPerItem * rate;
      return {
        category,
        weight: weightPerItem || 1,
        rate,
        total
      };
    });

    const images = uploadedImages.map((img) => ({
      url: img.url || img.preview,
      publicId: img.publicId || null
    }));

    // Prepare pickup address from addressData
    const pickupAddress = {
      street: addressData?.address || getTranslatedText('Address not provided'),
      coordinates: {
        lat: addressData?.coordinates?.lat || 0,
        lng: addressData?.coordinates?.lng || 0
      }
    };

    const payload = {
      scrapItems,
      preferredTime: pickupMode === 'immediate' ? 'Immediate Pickup' : preferredTime,
      pickupSlot: pickupSlotData,
      pickupAddress,
      images,
      notes
    };

    try {
      const response = await orderAPI.create(payload);
      const createdOrder = response.data?.order || null;

      if (createdOrder) {
        try {
          checkAndProcessMilestone(user.phone || user.id, 'user', 'firstRequest');
        } catch (err) {
          console.error('Error processing milestone:', err);
        }
      }

      navigate('/request-status', {
        state: { requestData: createdOrder || payload },
        replace: true
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      console.error('Error stack:', error.stack);
      alert(getTranslatedText(error.message || 'Failed to submit request. Please try again.'));
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedDate, selectedSlot, selectedCategories, uploadedImages, weightData, addressData, preferredTime, user, navigate, marketPrices, getTranslatedText, pickupMode]);

  const timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM'
  ];

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
          onClick={() => navigate('/add-scrap/address')}
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
          {getTranslatedText("Confirm & Apply")}
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Indicator */}
      <div className="px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: '75%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#64946e' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 5 of 5")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <h3 className="text-base md:text-lg font-bold mb-4" style={{ color: '#2d3748' }}>
            {getTranslatedText("Request Summary")}
          </h3>

          {/* Selected Categories */}
          <div className="mb-4">
            <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Categories:")}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-3 py-1.5 rounded-full text-xs md:text-sm font-medium"
                  style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)', color: '#64946e' }}
                >
                  {getTranslatedText(cat.name)}
                </span>
              ))}
            </div>
          </div>

          {/* Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                {getTranslatedText("Images")} ({uploadedImages.length}):
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden shadow-md"
                  >
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight */}
          {weightData && (
            <div className="mb-4">
              <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                {getTranslatedText("Weight:")}
              </p>
              <p className="text-base md:text-lg font-semibold" style={{ color: '#2d3748' }}>
                {weightData.weight} {getTranslatedText("kg")}
                {weightData.mode === 'auto' && (
                  <span className="text-xs md:text-sm ml-2" style={{ color: '#718096' }}>
                    {getTranslatedText("(Auto-detected)")}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Pickup Address */}
          {addressData && (
            <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
              <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                {getTranslatedText("Pickup Address:")}
              </p>
              <p className="text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
                {addressData.address}
              </p>
              {addressData.coordinates && (
                <p className="text-xs" style={{ color: '#718096' }}>
                  📍 {getTranslatedText("Location:")} {addressData.coordinates.lat.toFixed(6)}, {addressData.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {/* Price Breakdown */}
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
            <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Price Breakdown:")}
            </p>
            {selectedCategories.map((cat) => (
              <div key={cat.id} className="flex justify-between items-center mb-1">
                <span className="text-xs md:text-sm" style={{ color: '#2d3748' }}>
                  {getTranslatedText(cat.name)}
                </span>
                <span className="text-xs md:text-sm font-medium" style={{ color: '#64946e' }}>
                  ₹{marketPrices[cat.name] || 0}/{getTranslatedText("kg")}
                </span>
              </div>
            ))}
          </div>

          {/* Total Estimated Payout */}
          <div className="pt-4">
            <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Estimated Payout:")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold" style={{ color: '#64946e' }}>
                ₹{estimatedPayout.toFixed(0)}
              </span>
              <span className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("for")} {weightData?.weight || 0} {getTranslatedText("kg")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Additional Options */}
        <div className="space-y-4 md:space-y-6">
          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4 md:p-6"
            style={{ backgroundColor: '#ffffff' }}
          >
            <label className="block text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Additional Notes (Optional)")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={getTranslatedText("Add any special instructions or details about your scrap...")}
              rows={4}
              className="w-full py-2 px-3 md:py-3 md:px-4 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none text-sm md:text-base"
              style={{
                borderColor: notes ? '#64946e' : 'rgba(100, 148, 110, 0.3)',
                color: '#2d3748',
                backgroundColor: '#f9f9f9'
              }}
            />
          </motion.div>

          {/* Preferred Pickup Date & Time Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 md:p-6"
            style={{ backgroundColor: '#ffffff' }}
          >
            <label className="block text-sm md:text-base font-semibold mb-4" style={{ color: '#2d3748' }}>
              {getTranslatedText("Preferred Pickup Date & Time")}
            </label>

            {/* Mode Selection */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPickupMode('immediate')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${pickupMode === 'immediate'
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-md'
                    : 'border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/50'
                  }`}
              >
                <FaBolt className={`text-2xl mb-2 ${pickupMode === 'immediate' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">{getTranslatedText("Right Now")}</span>
              </button>

              <button
                type="button"
                onClick={() => setPickupMode('scheduled')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${pickupMode === 'scheduled'
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-md'
                    : 'border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/50'
                  }`}
              >
                <FaRegCalendarAlt className={`text-2xl mb-2 ${pickupMode === 'scheduled' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">{getTranslatedText("Schedule")}</span>
              </button>
            </div>

            {pickupMode === 'immediate' ? (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-center gap-3">
                <FaBolt className="text-yellow-600 text-xl" />
                <p className="text-sm text-yellow-800 font-medium">
                  {getTranslatedText("Scrapper will come immediately")}
                </p>
              </div>
            ) : (
              <>
                {/* Date selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaCalendarAlt className="text-green-600" />
                    {getTranslatedText("Select Date")}
                  </h4>
                  <div className="flex justify-center">
                    <Calendar
                      onChange={(date) => {
                        // Fix timezone offset issue
                        const offset = date.getTimezoneOffset();
                        const dateObj = new Date(date.getTime() - (offset * 60 * 1000));
                        const isoDate = dateObj.toISOString().split('T')[0];
                        setSelectedDate(isoDate);

                        // Update preferred time string
                        if (selectedSlot) {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayName = dayNames[date.getDay()];
                          const [h, m] = selectedSlot.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const formattedTime = `${hour % 12 || 12}:${m} ${ampm}`;
                          setPreferredTime(`${getTranslatedText(dayName)}, ${isoDate} • ${formattedTime}`);
                        }
                      }}
                      value={selectedDate ? new Date(selectedDate) : new Date()}
                      minDate={new Date()}
                      className="w-full border-none shadow-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Time selection */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaClock className="text-green-600" />
                    {getTranslatedText("Select Time")}
                  </h4>
                  <div className="flex flex-col gap-2">
                    <TimePicker
                      onChange={(value) => {
                        setSelectedSlot(value);
                        if (selectedDate && value) {
                          const dateObj = new Date(selectedDate);
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayName = dayNames[dateObj.getDay()];
                          const [h, m] = value.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const formattedTime = `${hour % 12 || 12}:${m} ${ampm}`;
                          setPreferredTime(`${getTranslatedText(dayName)}, ${selectedDate} • ${formattedTime}`);
                        } else {
                          setPreferredTime('');
                        }
                      }}
                      value={selectedSlot}
                      className="w-full"
                      clearIcon={null}
                      clockIcon={<FaClock className="text-green-600" />}
                      disableClock={false}
                      format="h:mm a"
                    />

                    {selectedSlot && (
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        {(() => {
                          const [h, m] = selectedSlot.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          return `${getTranslatedText("Selected Time")}: ${hour % 12 || 12}:${m} ${ampm}`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Small summary line when both selected */}
                {selectedDate && selectedSlot && (
                  <p className="mt-3 text-xs md:text-sm" style={{ color: '#718096' }}>
                    {getTranslatedText("You selected:")} <span className="font-semibold" style={{ color: '#2d3748' }}>{preferredTime}</span>
                  </p>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer with Apply Button - Fixed on Mobile */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t"
        style={{
          borderColor: 'rgba(100, 148, 110, 0.2)',
          backgroundColor: '#f4ebe2',
          pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 9999
        }}
      >
        {isSubmitting ? (
          <div className="w-full py-3 md:py-4 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 md:w-8 md:h-8 rounded-full border-4"
              style={{ borderTopColor: '#64946e', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}
            />
            <span className="ml-3 text-sm md:text-base font-semibold" style={{ color: '#64946e' }}>
              {getTranslatedText("Submitting Request...")}
            </span>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              console.log('Button clicked, isSubmitting:', isSubmitting, 'selectedDate:', selectedDate, 'selectedSlot:', selectedSlot);
              e.preventDefault();
              e.stopPropagation();
              if (!isSubmitting) {
                console.log('Calling handleSubmit');
                handleSubmit(e);
              } else {
                console.log('Already submitting, ignoring click');
              }
            }}
            type="button"
            disabled={isSubmitting}
            className="w-full py-4 md:py-5 rounded-full text-white font-bold text-base md:text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#64946e',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
              zIndex: 50,
              position: 'relative'
            }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#5a8263';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#64946e';
              }
            }}
          >
            {getTranslatedText("Apply for Pickup -")} ₹{estimatedPayout.toFixed(0)}
          </motion.button>
        )}
        <p className="text-xs md:text-sm text-center mt-3" style={{ color: '#718096' }}>
          {getTranslatedText("By applying, you agree to our terms and conditions")}
        </p>
      </div>
    </motion.div>
  );
};

export default PriceConfirmationPage;
