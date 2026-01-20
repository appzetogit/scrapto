import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategorySelection from './CategorySelection';

const AddScrapFlow = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Debug: Log when isOpen changes
  useEffect(() => {
    console.log('AddScrapFlow - isOpen changed to:', isOpen);
  }, [isOpen]);
  
  console.log('AddScrapFlow render - isOpen:', isOpen);
  
  const [scrapData, setScrapData] = useState({
    category: null,
    images: [],
    weight: null,
    autoDetectedWeight: null,
    marketPrice: null,
    estimatedPayout: null,
    notes: '',
    preferredTime: null
  });

  const handleCategorySelect = (category) => {
    setScrapData(prev => ({ ...prev, category }));
    // Stage 1 complete, will move to Stage 2 later
    // For now, just close after selection for review
    onClose();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onClose();
    }
  };

  // Force render for debugging
  if (isOpen) {
    console.log('AddScrapFlow: Rendering modal, isOpen is true');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-scrap-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ display: isOpen ? 'flex' : 'none' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="w-full max-w-2xl bg-[#f4ebe2] rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <CategorySelection
                  key="category-selection"
                  onSelect={handleCategorySelect}
                  onClose={handleBack}
                  selectedCategory={scrapData.category}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddScrapFlow;

