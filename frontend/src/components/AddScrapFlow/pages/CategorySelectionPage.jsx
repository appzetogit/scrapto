import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import plasticImage from '../../../assets/plastic.jpg';
import metalImage from '../../../assets/metal.jpg';
import scrapImage2 from '../../../modules/user/assets/scrab.png';
import electronicImage from '../../../modules/user/assets/electronicbg.png';

import { publicAPI } from '../../../modules/shared/utils/api';
import { getEffectivePriceFeed } from '../../../modules/shared/utils/priceFeedUtils';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const CategorySelectionPage = () => {
  const staticTexts = [
    "Select Scrap Category",
    "Step 1 of 4",
    "Continue with",
    "Category",
    "Categories",
    "Selected:",
    "Select one or more categories to continue",
    "kg",
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
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get image based on category name
  const getCategoryImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('plastic')) return plasticImage;
    if (lowerName.includes('metal') || lowerName.includes('iron') || lowerName.includes('steel') || lowerName.includes('copper') || lowerName.includes('brass') || lowerName.includes('aluminium') || lowerName.includes('gold') || lowerName.includes('silver')) return metalImage;
    if (lowerName.includes('paper') || lowerName.includes('book') || lowerName.includes('cardboard') || lowerName.includes('newspaper')) return scrapImage2;
    if (lowerName.includes('electron') || lowerName.includes('device') || lowerName.includes('computer') || lowerName.includes('phone') || lowerName.includes('wire')) return electronicImage;
    if (lowerName.includes('glass')) return scrapImage2; // Use a default or specific if available
    return scrapImage2; // Default fallback
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Try to fetch from API first
        const response = await publicAPI.getPrices();

        if (response.success && response.data?.prices && response.data.prices.length > 0) {
          const mappedCategories = response.data.prices.map(price => ({
            id: price.category.toLowerCase().replace(/\s+/g, '-'),
            name: price.category,
            image: price.image || getCategoryImage(price.category),
            price: price.pricePerKg
          }));
          setCategories(mappedCategories);
        } else {
          throw new Error('No prices from API');
        }
      } catch (error) {
        console.error('Failed to fetch categories from API, using default:', error);
        // Fallback to local default feed
        const defaultFeed = getEffectivePriceFeed();
        const mappedCategories = defaultFeed.map(item => ({
          id: item.category.toLowerCase().replace(/\s+/g, '-'),
          name: item.category,
          image: getCategoryImage(item.category),
          price: item.pricePerKg
        }));
        setCategories(mappedCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Auto-select category if coming from AllCategoriesPage
  useEffect(() => {
    const preSelectedCategoryName = location.state?.preSelectedCategory;
    if (preSelectedCategoryName && categories.length > 0) {
      const categoryToSelect = categories.find(
        cat => cat.name.toLowerCase() === preSelectedCategoryName.toLowerCase()
      );
      if (categoryToSelect && selectedCategories.length === 0) {
        setSelectedCategories([categoryToSelect]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, categories]);

  const handleCategoryClick = (category) => {
    setSelectedCategories(prev => {
      // Toggle selection: if already selected, remove it; otherwise add it
      const isSelected = prev.some(cat => cat.id === category.id);
      if (isSelected) {
        return prev.filter(cat => cat.id !== category.id);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length > 0) {
      // Store selected categories in sessionStorage for next step
      sessionStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
      // Navigate to next step (will be Stage 2: Image Upload)
      navigate('/add-scrap/upload');
    }
  };

  const isCategorySelected = (categoryId) => {
    return selectedCategories.some(cat => cat.id === categoryId);
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
      <div className="flex items-center justify-between p-4 md:p-6 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2
          className="text-xl md:text-2xl font-bold"
          style={{ color: '#2d3748' }}
        >
          {getTranslatedText("Select Scrap Category")}
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Indicator */}
      <div className="px-4 md:px-6 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '25%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#64946e' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 1 of 4")}</span>
        </div>
      </div>

      {/* Categories Grid - Circular Cards */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category)}
              className="cursor-pointer flex flex-col items-center"
            >
              {/* Circular Image Container */}
              <div
                className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                style={{
                  border: isCategorySelected(category.id) ? '3px solid #64946e' : '3px solid transparent'
                }}
              >
                <img
                  src={category.image}
                  alt={getTranslatedText(category.name)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isCategorySelected(category.id) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(100, 148, 110, 0.4)' }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#64946e' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white md:w-5 md:h-5">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Category Info Below Circle */}
              <div className="mt-2 md:mt-3 text-center">
                <p
                  className="text-xs md:text-sm font-semibold mb-0.5 md:mb-1"
                  style={{ color: '#2d3748' }}
                >
                  {getTranslatedText(category.name)}
                </p>
                <p
                  className="text-[10px] md:text-xs font-medium"
                  style={{ color: '#64946e' }}
                >
                  ₹{category.price}/{getTranslatedText("kg")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer with Continue Button - Fixed on Mobile */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-4 md:p-6 border-t z-50"
        style={{
          borderColor: 'rgba(100, 148, 110, 0.2)',
          backgroundColor: '#f4ebe2'
        }}
      >
        {selectedCategories.length > 0 ? (
          <div>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleContinue}
              className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: '#64946e' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8263'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#64946e'}
            >
              {getTranslatedText("Continue with")} {selectedCategories.length} {selectedCategories.length === 1 ? getTranslatedText("Category") : getTranslatedText("Categories")}
            </motion.button>
            <p
              className="text-xs md:text-sm text-center mt-2"
              style={{ color: '#718096' }}
            >
              {getTranslatedText("Selected:")} {selectedCategories.map(cat => getTranslatedText(cat.name)).join(', ')}
            </p>
          </div>
        ) : (
          <p
            className="text-xs md:text-sm text-center"
            style={{ color: '#718096' }}
          >
            {getTranslatedText("Select one or more categories to continue")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CategorySelectionPage;

