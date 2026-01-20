import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';
import { IoLanguageOutline, IoChevronDownOutline } from 'react-icons/io5';

const LanguageSelector = ({ variant = 'light', direction = 'bottom' }) => {
    const { language, languages, changeLanguage, isChangingLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = languages[language] || languages['en'];

    // Styles based on variant
    const buttonStyles = variant === 'dark'
        ? {
            bg: 'bg-gray-800',
            text: 'text-gray-100',
            border: 'border-gray-700',
            hover: 'hover:bg-gray-700'
        }
        : {
            bg: 'bg-white',
            text: 'text-gray-700',
            border: 'border-gray-200',
            hover: 'hover:bg-gray-50'
        };

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shadow-sm ${buttonStyles.bg} ${buttonStyles.text} ${buttonStyles.border} ${buttonStyles.hover}`}
                aria-label="Select Language"
            >
                <IoLanguageOutline className="text-lg" />
                <span className="hidden md:inline font-medium text-sm">
                    {currentLang.label.split(' ')[0]}
                </span>
                <IoChevronDownOutline
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: direction === 'top' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute ${direction === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50`}
                        style={{ maxHeight: '80vh' }}
                    >
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Language</p>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
                            {Object.entries(languages).map(([code, lang]) => (
                                <button
                                    key={code}
                                    onClick={() => {
                                        changeLanguage(code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-emerald-50 ${language === code ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{lang.flag}</span>
                                        <span className="font-medium text-sm">{lang.label}</span>
                                    </div>
                                    {language === code && (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSelector;
