import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import translationService from '../services/translationService';
import { staticTranslations } from '../locales/staticTranslations';

/**
 * Hook for static page content translation
 * Automatically translates a list of strings and provides a helper to get them
 * NOW OPTIMIZED with local static dictionary lookup
 */
export const usePageTranslation = (staticTexts = [], sourceLang = 'en') => {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!staticTexts || staticTexts.length === 0) return;

    const translateAll = async () => {
      // 1. Check local dictionary first
      const localDict = staticTranslations[language] || {};
      const missingTexts = [];
      const newTranslations = {};

      staticTexts.forEach(text => {
        if (language === sourceLang) {
          // If native language, use text as is
          newTranslations[text] = text;
        } else if (localDict[text]) {
          // Found in dictionary
          newTranslations[text] = localDict[text];
        } else {
          // Need to fetch from API
          missingTexts.push(text);
          // Temporary placeholder until fetched
          newTranslations[text] = text;
        }
      });

      // If everything found locally, we're done!
      if (missingTexts.length === 0) {
        setTranslations(newTranslations);
        return;
      }

      // 2. Fetch missing texts from API
      setIsTranslating(true);
      try {
        const results = await translationService.translateBatch(missingTexts, language, sourceLang);

        // Merge API results
        missingTexts.forEach((text, index) => {
          newTranslations[text] = results[index];
        });

        setTranslations(newTranslations);
      } catch (error) {
        console.error('Page translation error:', error);
        // Fallback is already set (original text)
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
