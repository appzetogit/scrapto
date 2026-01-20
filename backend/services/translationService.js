import axios from "axios";
import logger from "../utils/logger.js";
import { googleCloudConfig, languageCodeMap } from "../config/googleCloud.js";

// In-memory cache
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired cache entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000);

const getCacheKey = (text, targetLang, sourceLang) => {
  const normalizedText = text.trim();
  return `${sourceLang || "auto"}_${targetLang}_${Buffer.from(
    normalizedText
  ).toString("base64")}`;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core translation function with retry logic and exponential backoff
 */
const performTranslation = async (
  text,
  targetLang,
  sourceLang,
  retryCount = 0
) => {
  const apiKey = googleCloudConfig.apiKey;
  console.log("🔍 Translating:", {
    text,
    targetLang,
    sourceLang,
    hasApiKey: !!apiKey,
  });
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  try {
    const response = await axios.post(url, {
      q: text,
      target: languageCodeMap[targetLang] || targetLang,
      source: sourceLang
        ? languageCodeMap[sourceLang] || sourceLang
        : undefined,
      format: "text",
    });

    const translation = response.data.data.translations[0].translatedText;

    // Never cache translations that equal original text (indicates API issue or same language)
    if (translation === text) {
      return translation;
    }

    return translation;
  } catch (error) {
    if (error.response && error.response.status === 429 && retryCount < 3) {
      const waitTime = Math.pow(2, retryCount) * 1000;
      logger.warn(`Rate limited. Retrying in ${waitTime}ms...`);
      await delay(waitTime);
      return performTranslation(text, targetLang, sourceLang, retryCount + 1);
    }

    logger.error(
      "Translation API error:",
      JSON.stringify(error.response?.data || error.message, null, 2)
    );
    throw error;
  }
};

/**
 * Translate single text
 */
export const translateText = async (text, targetLang, sourceLang) => {
  if (!text || !text.trim()) return text;

  const cacheKey = getCacheKey(text, targetLang, sourceLang);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.translation;
  }

  try {
    const translation = await performTranslation(text, targetLang, sourceLang);

    if (translation !== text) {
      cache.set(cacheKey, {
        translation,
        timestamp: Date.now(),
      });
    }

    return translation;
  } catch (error) {
    return text; // Fallback to original text
  }
};

/**
 * Translate batch of texts
 */
export const translateBatch = async (texts, targetLang, sourceLang) => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  // Split into cached and non-cached
  const results = new Array(texts.length);
  const toTranslate = [];
  const toTranslateIndices = [];

  texts.forEach((text, index) => {
    if (!text || !text.trim()) {
      results[index] = text;
      return;
    }

    const cacheKey = getCacheKey(text, targetLang, sourceLang);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results[index] = cached.translation;
    } else {
      toTranslate.push(text);
      toTranslateIndices.push(index);
    }
  });

  if (toTranslate.length === 0) return results;

  try {
    // Google Translate V2 supports multiple 'q' parameters for batching
    const apiKey = googleCloudConfig.apiKey;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await axios.post(url, {
      q: toTranslate,
      target: languageCodeMap[targetLang] || targetLang,
      source: sourceLang
        ? languageCodeMap[sourceLang] || sourceLang
        : undefined,
      format: "text",
    });

    const translations = response.data.data.translations;

    translations.forEach((t, i) => {
      const originalIndex = toTranslateIndices[i];
      const translatedText = t.translatedText;
      results[originalIndex] = translatedText;

      // Cache if different from original
      if (translatedText !== toTranslate[i]) {
        const cacheKey = getCacheKey(toTranslate[i], targetLang, sourceLang);
        cache.set(cacheKey, {
          translation: translatedText,
          timestamp: Date.now(),
        });
      }
    });

    return results;
  } catch (error) {
    logger.error("Batch translation error:", error.message);
    // Fallback for failed items
    toTranslateIndices.forEach((originalIndex, i) => {
      results[originalIndex] = toTranslate[i];
    });
    return results;
  }
};

/**
 * Translate object properties
 */
export const translateObject = async (
  obj,
  targetLang,
  sourceLang,
  keysToTranslate
) => {
  if (!obj || typeof obj !== "object") return obj;

  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
  const entries = Object.entries(obj);

  const textsToTranslate = [];
  const paths = [];

  const collectTexts = (currentObj, currentPath = []) => {
    for (const [key, value] of Object.entries(currentObj)) {
      const fullPath = [...currentPath, key];

      if (
        keysToTranslate.includes(key) &&
        typeof value === "string" &&
        value.trim()
      ) {
        textsToTranslate.push(value);
        paths.push(fullPath);
      } else if (value && typeof value === "object") {
        collectTexts(value, fullPath);
      }
    }
  };

  collectTexts(obj);

  if (textsToTranslate.length === 0) return newObj;

  const translatedTexts = await translateBatch(
    textsToTranslate,
    targetLang,
    sourceLang
  );

  // Reconstruct object
  const setPath = (target, path, value) => {
    const [key, ...rest] = path;
    if (rest.length === 0) {
      target[key] = value;
    } else {
      setPath(target[key], rest, value);
    }
  };

  paths.forEach((path, i) => {
    setPath(newObj, path, translatedTexts[i]);
  });

  return newObj;
};

export default {
  translateText,
  translateBatch,
  translateObject,
};
