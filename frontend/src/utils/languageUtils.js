// Language code normalization map (Frontend version)
export const languageCodeMap = {
  'en': 'en',
  'hi': 'hi',
  'ar': 'ar',
  'fr': 'fr',
  'es': 'es',
  'de': 'de',
  'it': 'it',
  'ja': 'ja',
  'ko': 'ko',
  'zh': 'zh-CN',
  'ru': 'ru',
  'pt': 'pt',
  'bn': 'bn',
  'ta': 'ta',
  'te': 'te',
  'ml': 'ml',
  'kn': 'kn',
  'gu': 'gu',
  'mr': 'mr',
  'pa': 'pa',
};

// Languages that require Right-to-Left (RTL) support
export const rtlLanguages = ['ar', 'he', 'ur', 'fa'];

/**
 * Normalize language code for API compatibility
 */
export const normalizeLanguageCode = (code) => {
  if (!code) return 'en';
  const baseCode = code.split('-')[0].toLowerCase();
  return languageCodeMap[baseCode] || baseCode;
};

/**
 * Check if a language is RTL
 */
export const isRTL = (code) => {
  const normalized = normalizeLanguageCode(code);
  return rtlLanguages.includes(normalized);
};

export default {
  languageCodeMap,
  rtlLanguages,
  normalizeLanguageCode,
  isRTL
};
