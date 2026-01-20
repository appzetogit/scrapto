import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import translationService from '../services/translationService';

/**
 * Component to wrap and automatically translate text content
 */
const TranslatedText = ({ children, sourceLang = 'en', className = '' }) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(children);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof children !== 'string' || !children.trim()) {
      setTranslatedText(children);
      return;
    }

    let isMounted = true;
    const translate = async () => {
      setLoading(true);
      try {
        const result = await translationService.translateText(children, language, sourceLang);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('TranslatedText error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [children, language, sourceLang]);

  return (
    <span className={`${className} ${loading ? 'opacity-50' : ''}`}>
      {translatedText}
    </span>
  );
};

export default TranslatedText;
