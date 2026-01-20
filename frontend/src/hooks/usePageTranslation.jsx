import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import translationService from '../services/translationService';

/**
 * Hook for static page content translation
 * Automatically translates a list of strings and provides a helper to get them
 */
export const usePageTranslation = (staticTexts = [], sourceLang = 'en') => {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!staticTexts || staticTexts.length === 0) return;

    const translateAll = async () => {
      setIsTranslating(true);
      try {
        const results = await translationService.translateBatch(staticTexts, language, sourceLang);
        const newTranslations = {};
        staticTexts.forEach((text, index) => {
          newTranslations[text] = results[index];
        });
        setTranslations(newTranslations);
      } catch (error) {
        console.error('Page translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, JSON.stringify(staticTexts), sourceLang]);

  const getTranslatedText = useCallback((text, params = {}) => {
    let translated = translations[text] || text;

    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach(key => {
        // Replace {key} globally
        translated = translated.split(`{${key}}`).join(params[key]);
      });
    }

    return translated;
  }, [translations]);

  return {
    getTranslatedText,
    isTranslating,
    translations,
    currentLanguage: language
  };
};

export default usePageTranslation;
