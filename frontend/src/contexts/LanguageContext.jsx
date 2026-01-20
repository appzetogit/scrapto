import React, { createContext, useContext, useState, useEffect } from 'react';
import { isRTL, normalizeLanguageCode } from '../utils/languageUtils';

const LanguageContext = createContext();

export const languages = {
  en: { label: 'English', flag: '🇺🇸' },
  hi: { label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  bn: { label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  mr: { label: 'मराठी (Marathi)', flag: '🇮🇳' },
  te: { label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  ta: { label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  gu: { label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  ur: { label: 'اردو (Urdu)', flag: '🇮🇳' },
  kn: { label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  or: { label: 'ଓଡ଼ିଆ (Odia)', flag: '🇮🇳' },
  ml: { label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  pa: { label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  as: { label: 'অসমীয়া (Assamese)', flag: '🇮🇳' },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    // Update document direction for RTL support
    const dir = isRTL(language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = normalizeLanguageCode(language);

    // Save to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = async (newLang) => {
    if (newLang === language) return;

    setIsChangingLanguage(true);
    try {
      setLanguage(newLang);
      // We don't need to wait for anything here since translations happen dynamically
      // but we add a small delay for UX if needed
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsChangingLanguage(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, languages, changeLanguage, isChangingLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
