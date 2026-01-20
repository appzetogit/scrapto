import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageTranslation } from '../hooks/usePageTranslation';
import { IoLanguageOutline, IoChevronDownOutline } from 'react-icons/io5';

const Header = () => {
  const [hasNotifications, setHasNotifications] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, languages, changeLanguage } = useLanguage();
  
  const staticTexts = ["Hi, User!", "Welcome back to Scrapto"];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  return (
    <motion.header
      initial={{ y: -10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 md:px-6 lg:px-8 py-4 md:py-6"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{ color: '#2d3748' }}
          >
            {getTranslatedText("Hi, User!")}
          </h2>
          <p 
            className="text-sm md:text-base"
            style={{ color: '#718096' }}
          >
            {getTranslatedText("Welcome back to Scrapto")}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all text-sm font-medium"
              style={{ color: '#4a5568' }}
            >
              <IoLanguageOutline className="text-lg" />
              <span>{languages[language]?.label.split(' ')[0]}</span>
              <IoChevronDownOutline className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsLangOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {Object.entries(languages).map(([code, { label, flag }]) => (
                        <button
                          key={code}
                          onClick={() => {
                            changeLanguage(code);
                            setIsLangOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                            language === code ? 'text-green-600 bg-green-50' : 'text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{flag}</span>
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setHasNotifications(false)}
              className="relative p-2 rounded-full transition-colors"
              style={{ 
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 148, 110, 0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: '#64946e' }}
              >
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {hasNotifications && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

