import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { IoLanguageOutline, IoChevronDownOutline } from 'react-icons/io5';
import LanguageSelector from './LanguageSelector';
import siteLogo from '../../../assets/scraptologo-removebg-preview.png';

const WebViewHeader = ({ navItems, userRole = 'user' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const { language, languages, changeLanguage } = useLanguage();

    const { getTranslatedText } = usePageTranslation(navItems.map(item => item.label));

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-6 py-4 justify-between items-center"
        >
            {/* Logo Area */}
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate(userRole === 'scrapper' ? '/scrapper/dashboard' : '/')}
            >
                <img
                    src={siteLogo}
                    alt="Scrapto"
                    className="h-14 w-48 object-contain object-left -ml-2"
                />
            </div>

            {/* Navigation Items */}
            <nav className="flex items-center gap-8">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <div
                            key={item.path}
                            className="relative group cursor-pointer"
                            onClick={() => navigate(item.path)}
                        >
                            <div className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300
                ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'}
              `}>
                                <item.icon className={`text-lg ${isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}`} />
                                <span className="font-medium text-sm">{getTranslatedText(item.label)}</span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId={`underline-${userRole}`}
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                                />
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Right Side Actions (Profile/Notifications/Language) */}
            <div className="flex items-center gap-4">
                {/* Language Selector */}
                {/* Language Selector */}
                <LanguageSelector />

                <div
                    className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                    onClick={() => navigate(userRole === 'scrapper' ? '/scrapper/profile' : '/my-profile')}
                >
                    <span className="font-semibold text-emerald-700">
                        {/* Initials could go here */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600 hover:text-emerald-600">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </div>
            </div>
        </motion.header>
    );
};

export default WebViewHeader;
