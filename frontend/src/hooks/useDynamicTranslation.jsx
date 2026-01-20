import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import translationService from '../services/translationService';

/**
 * Hook for dynamic translation of API responses and user-generated content
 */
export const useDynamicTranslation = (options = {}) => {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const sourceLang = options.sourceLang || 'en';

  const translate = useCallback(async (text) => {
    if (!text) return text;
    setIsTranslating(true);
    try {
      return await translationService.translateText(text, language, sourceLang);
    } finally {
      setIsTranslating(false);
    }
  }, [language, sourceLang]);

  const translateBatch = useCallback(async (texts) => {
    if (!texts || texts.length === 0) return texts;
    setIsTranslating(true);
    try {
      return await translationService.translateBatch(texts, language, sourceLang);
    } finally {
      setIsTranslating(false);
    }
  }, [language, sourceLang]);

  const translateObject = useCallback(async (obj, keysToTranslate) => {
    if (!obj) return obj;
    setIsTranslating(true);
    try {
      return await translationService.translateObject(obj, language, sourceLang, keysToTranslate);
    } finally {
      setIsTranslating(false);
    }
  }, [language, sourceLang]);

  return {
    translate,
    translateBatch,
    translateObject,
    isTranslating,
    currentLanguage: language
  };
};

export default useDynamicTranslation;
