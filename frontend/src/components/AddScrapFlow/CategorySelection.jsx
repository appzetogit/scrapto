import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import plasticImage from '../../assets/plastic.jpg';
import metalImage from '../../assets/metal.jpg';
import scrapImage2 from '../../modules/user/assets/scrab.png';
import electronicImage from '../../modules/user/assets/electronicbg.png';

const CategorySelection = ({ onSelect, onClose, selectedCategory: propSelectedCategory }) => {
  const [marketPrices, setMarketPrices] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(propSelectedCategory);

  // Fetch market prices from backend
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const { publicAPI } = await import('../../modules/shared/utils/api');
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

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleContinue = () => {
    if (selectedCategory) {
      onSelect(selectedCategory);
    }
  };

  const categories = [
    {
      id: 'plastic',
      name: 'Plastic',
      image: plasticImage,
      price: marketPrices['Plastic'] || 45
    },
    {
      id: 'metal',
      name: 'Metal',
      image: metalImage,
      price: marketPrices['Metal'] || 180
    },
    {
      id: 'paper',
      name: 'Paper',
      image: scrapImage2,
      price: marketPrices['Paper'] || 12
    },
    {
      id: 'electronics',
      name: 'Electronics',
      image: electronicImage,
      price: marketPrices['Electronics'] || 85
    },
    {
      id: 'copper',
      name: 'Copper',
      image: metalImage, // Using metal image as placeholder
      price: marketPrices['Copper'] || 650
    },
    {
      id: 'aluminium',
      name: 'Aluminium',
      image: metalImage, // Using metal image as placeholder
      price: marketPrices['Aluminium'] || 180
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: '#f4ebe2' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
        <button
          onClick={onClose}
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
          Select Scrap Category
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
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>Step 1 of 4</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category)}
              className="cursor-pointer"
            >
              <div
                className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: '#ffffff',
                  border: selectedCategory?.id === category.id ? '2px solid #64946e' : '2px solid transparent'
                }}
              >
                {/* Category Image */}
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedCategory?.id === category.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(100, 148, 110, 0.3)' }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#64946e' }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Category Info */}
                <div className="p-3 md:p-4">
                  <p
                    className="text-sm md:text-base font-semibold mb-1"
                    style={{ color: '#2d3748' }}
                  >
                    {category.name}
                  </p>
                  <p
                    className="text-xs md:text-sm font-medium"
                    style={{ color: '#64946e' }}
                  >
                    ₹{category.price}/kg
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer with Continue Button */}
      <div className="p-4 md:p-6 border-t" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
        {selectedCategory ? (
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
            Continue with {selectedCategory.name}
          </motion.button>
        ) : (
          <p
            className="text-xs md:text-sm text-center"
            style={{ color: '#718096' }}
          >
            Select a category to continue
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CategorySelection;

