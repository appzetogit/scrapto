import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const WeightInputPage = () => {
  const staticTexts = [
    "Enter Weight",
    "Step 3 of 4",
    "Uploaded Images",
    "Auto Detect",
    "Manual Input",
    "Analyzing Images...",
    "Detecting weight from your images",
    "Auto-detected Weight",
    "Based on image analysis",
    "Edit",
    "Click \"Auto Detect\" to analyze your images",
    "Enter Weight (kg)",
    "kg",
    "Quick Select:",
    "Estimated Payout",
    "for",
    "Enter weight to continue",
    "Continue with",
    "Plastic",
    "Metal",
    "Paper",
    "Electronics",
    "Copper",
    "Aluminium",
    "Steel",
    "Brass"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [weightMode, setWeightMode] = useState('manual'); // 'auto' or 'manual'
  const [autoDetectedWeight, setAutoDetectedWeight] = useState(null);
  const [manualWeight, setManualWeight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});
  const [estimatedPayout, setEstimatedPayout] = useState(0);

  // Load data from sessionStorage
  useEffect(() => {
    const storedImages = sessionStorage.getItem('uploadedImages');
    const storedCategories = sessionStorage.getItem('selectedCategories');

    if (storedImages) {
      setUploadedImages(JSON.parse(storedImages));
    }
    if (storedCategories) {
      setSelectedCategories(JSON.parse(storedCategories));
    } else {
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

  // Auto-detect weight from images (mock API call) - HIDDEN FOR NOW
  // useEffect(() => {
  //   if (uploadedImages.length > 0 && weightMode === 'auto') {
  //     setIsAnalyzing(true);
  //     // Simulate API call for weight detection
  //     setTimeout(() => {
  //       // Mock: Generate random weight between 5-50 kg
  //       const detectedWeight = (Math.random() * 45 + 5).toFixed(1);
  //       setAutoDetectedWeight(parseFloat(detectedWeight));
  //       setIsAnalyzing(false);
  //     }, 2000);
  //   }
  // }, [uploadedImages, weightMode]);

  // Calculate estimated payout
  useEffect(() => {
    if (selectedCategories.length > 0) {
      const currentWeight = weightMode === 'auto' && autoDetectedWeight
        ? autoDetectedWeight
        : parseFloat(manualWeight) || 0;

      if (currentWeight > 0) {
        // Calculate average price from selected categories
        const totalPrice = selectedCategories.reduce((sum, cat) => {
          return sum + (marketPrices[cat.name] || 0);
        }, 0);
        const avgPrice = totalPrice / selectedCategories.length;
        const payout = currentWeight * avgPrice;
        setEstimatedPayout(payout);
      } else {
        setEstimatedPayout(0);
      }
    }
  }, [selectedCategories, weightMode, autoDetectedWeight, manualWeight, marketPrices]);

  const handleWeightChange = (value) => {
    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setManualWeight(value);
    }
  };

  const handleQuickWeight = (weight) => {
    setManualWeight(weight.toString());
    setWeightMode('manual');
  };

  const handleContinue = () => {
    const finalWeight = weightMode === 'auto' && autoDetectedWeight
      ? autoDetectedWeight
      : parseFloat(manualWeight);

    if (finalWeight > 0) {
      const weightData = {
        weight: finalWeight,
        mode: weightMode,
        autoDetected: autoDetectedWeight,
        estimatedPayout: estimatedPayout
      };
      sessionStorage.setItem('weightData', JSON.stringify(weightData));
      navigate('/add-scrap/address');
    }
  };

  const currentWeight = weightMode === 'auto' && autoDetectedWeight
    ? autoDetectedWeight
    : parseFloat(manualWeight) || 0;

  const quickWeights = [5, 10, 15, 20, 25, 30];

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
          onClick={() => navigate('/add-scrap/upload')}
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
          {getTranslatedText("Enter Weight")}
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Indicator */}
      <div className="px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: '75%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#64946e' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 3 of 4")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        {/* Image Preview */}
        {uploadedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Uploaded Images")} ({uploadedImages.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {uploadedImages.slice(0, 3).map((image) => (
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
              {uploadedImages.length > 3 && (
                <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center bg-gray-200">
                  <span className="text-xs md:text-sm font-semibold" style={{ color: '#718096' }}>
                    +{uploadedImages.length - 3}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Weight Mode Toggle - Auto Detect Hidden */}
        {/* <div className="mb-4 md:mb-6">
          <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
            <button
              onClick={() => setWeightMode('auto')}
              className={`flex-1 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 ${
                weightMode === 'auto' ? 'shadow-md' : ''
              }`}
              style={{
                backgroundColor: weightMode === 'auto' ? '#64946e' : 'transparent',
                color: weightMode === 'auto' ? '#ffffff' : '#2d3748'
              }}
            >
              {getTranslatedText("Auto Detect")}
            </button>
            <button
              onClick={() => setWeightMode('manual')}
              className={`flex-1 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 ${
                weightMode === 'manual' ? 'shadow-md' : ''
              }`}
              style={{
                backgroundColor: weightMode === 'manual' ? '#64946e' : 'transparent',
                color: weightMode === 'manual' ? '#ffffff' : '#2d3748'
              }}
            >
              {getTranslatedText("Manual Input")}
            </button>
          </div>
        </div> */}

        {/* Auto Detection Section - HIDDEN */}
        {/* {weightMode === 'auto' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            {isAnalyzing ? (
              <div className="rounded-xl p-6 md:p-8 text-center" style={{ backgroundColor: '#ffffff' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full border-4"
                  style={{ borderTopColor: '#64946e', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}
                />
                <p className="text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Analyzing Images...")}
                </p>
                <p className="text-xs md:text-sm" style={{ color: '#718096' }}>
                  {getTranslatedText("Detecting weight from your images")}
                </p>
              </div>
            ) : autoDetectedWeight ? (
              <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#ffffff' }}>
                <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                  {getTranslatedText("Auto-detected Weight")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: '#64946e' }}>
                      {autoDetectedWeight} <span className="text-lg md:text-xl" style={{ color: '#718096' }}>{getTranslatedText("kg")}</span>
                    </div>
                    <p className="text-xs md:text-sm" style={{ color: '#718096' }}>
                      {getTranslatedText("Based on image analysis")}
                    </p>
                  </div>
                  <button
                    onClick={() => setWeightMode('manual')}
                    className="px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium border-2 transition-all duration-300"
                    style={{ borderColor: '#64946e', color: '#64946e' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(100, 148, 110, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {getTranslatedText("Edit")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-6 md:p-8 text-center" style={{ backgroundColor: '#ffffff' }}>
                <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                  {getTranslatedText('Click "Auto Detect" to analyze your images')}
                </p>
              </div>
            )}
          </motion.div>
        )} */}

        {/* Manual Input Section */}
        {(
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#ffffff' }}>
              <label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("Enter Weight (kg)")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualWeight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="0.0"
                  className="w-full py-3 md:py-4 px-4 text-2xl md:text-3xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: manualWeight ? '#64946e' : 'rgba(100, 148, 110, 0.3)',
                    color: '#2d3748',
                    backgroundColor: '#f9f9f9'
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg md:text-xl font-semibold" style={{ color: '#718096' }}>
                  {getTranslatedText("kg")}
                </span>
              </div>
            </div>

            {/* Quick Weight Buttons */}
            <div className="mt-4">
              <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                {getTranslatedText("Quick Select:")}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickWeights.map((weight) => (
                  <button
                    key={weight}
                    onClick={() => handleQuickWeight(weight)}
                    className="px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 border-2"
                    style={{
                      borderColor: manualWeight === weight.toString() ? '#64946e' : 'rgba(100, 148, 110, 0.3)',
                      backgroundColor: manualWeight === weight.toString() ? '#64946e' : 'transparent',
                      color: manualWeight === weight.toString() ? '#ffffff' : '#64946e'
                    }}
                    onMouseEnter={(e) => {
                      if (manualWeight !== weight.toString()) {
                        e.target.style.backgroundColor = 'rgba(100, 148, 110, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (manualWeight !== weight.toString()) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {weight} {getTranslatedText("kg")}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Price Calculation Preview */}
        {currentWeight > 0 && selectedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 md:p-6 mb-4 md:mb-6"
            style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
          >
            <p className="text-xs md:text-sm mb-3" style={{ color: '#718096' }}>
              {getTranslatedText("Estimated Payout")}
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl md:text-3xl font-bold" style={{ color: '#64946e' }}>
                ₹{estimatedPayout.toFixed(0)}
              </span>
              <span className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("for")} {currentWeight} {getTranslatedText("kg")}
              </span>
            </div>
            <div className="text-xs md:text-sm" style={{ color: '#718096' }}>
              {selectedCategories.map((cat, idx) => (
                <span key={cat.id}>
                  {getTranslatedText(cat.name)} @ ₹{marketPrices[cat.name] || 0}/{getTranslatedText("kg")}
                  {idx < selectedCategories.length - 1 && ' • '}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer with Continue Button - Fixed on Mobile */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t z-50"
        style={{
          borderColor: 'rgba(100, 148, 110, 0.2)',
          backgroundColor: '#f4ebe2'
        }}
      >
        {currentWeight > 0 ? (
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
            {getTranslatedText("Continue with")} {currentWeight} {getTranslatedText("kg")}
          </motion.button>
        ) : (
          <p
            className="text-xs md:text-sm text-center"
            style={{ color: '#718096' }}
          >
            {getTranslatedText("Enter weight to continue")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default WeightInputPage;

