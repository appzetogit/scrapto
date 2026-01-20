import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from '../modules/shared/utils/api.js';
import translationCache from '../utils/translationCache.js';
import { normalizeLanguageCode } from '../utils/languageUtils.js';

class TranslationService {
  constructor() {
    this.queue = [];
    this.batchTimeout = null;
    this.isProcessing = false;
    this.BATCH_WINDOW = 100; // 100ms window to collect requests
    this.MAX_BATCH_SIZE = 10;
    this.MIN_REQUEST_INTERVAL = 200; // 200ms between API calls
    this.lastRequestTime = 0;
  }

  /**
   * Translate single text with batching
   */
  async translateText(text, targetLang, sourceLang = 'en') {
    if (!text || !text.trim()) return text;
    
    const normalizedTarget = normalizeLanguageCode(targetLang);
    const normalizedSource = normalizeLanguageCode(sourceLang);
    
    if (normalizedTarget === normalizedSource) return text;

    const cacheKey = translationCache.getCacheKey(text, normalizedTarget, normalizedSource);
    const cached = await translationCache.get(cacheKey);
    if (cached) return cached;

    return new Promise((resolve, reject) => {
      this.queue.push({
        text,
        targetLang: normalizedTarget,
        sourceLang: normalizedSource,
        resolve,
        reject,
        cacheKey
      });

      this.scheduleBatch();
    });
  }

  scheduleBatch() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.processQueue();
    }, this.BATCH_WINDOW);
  }

  async processQueue() {
    if (this.queue.length === 0 || this.isProcessing) return;

    // Wait for minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      setTimeout(() => this.processQueue(), this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
      return;
    }

    this.isProcessing = true;
    
    // Group by target and source language for batching
    const batches = {};
    const itemsToProcess = this.queue.splice(0, this.MAX_BATCH_SIZE);
    
    itemsToProcess.forEach(item => {
      const groupKey = `${item.sourceLang}_${item.targetLang}`;
      if (!batches[groupKey]) batches[groupKey] = [];
      batches[groupKey].push(item);
    });

    try {
      await Promise.all(Object.entries(batches).map(async ([key, items]) => {
        const [sourceLang, targetLang] = key.split('_');
        const texts = items.map(i => i.text);

        try {
          this.lastRequestTime = Date.now();
          const response = await apiRequest(API_ENDPOINTS.translate.batch, {
            method: 'POST',
            body: JSON.stringify({ texts, targetLang, sourceLang })
          });

          if (response.success) {
            const translations = response.data.translations;
            items.forEach((item, index) => {
              const translated = translations[index];
              translationCache.set(item.cacheKey, translated);
              item.resolve(translated);
            });
          } else {
            throw new Error('Batch translation failed');
          }
        } catch (error) {
          console.error('Batch translation error:', error);
          items.forEach(item => item.resolve(item.text)); // Fallback
        }
      }));
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Translate batch of texts
   */
  async translateBatch(texts, targetLang, sourceLang = 'en') {
    return Promise.all(texts.map(text => this.translateText(text, targetLang, sourceLang)));
  }

  /**
   * Translate object properties
   */
  async translateObject(obj, targetLang, sourceLang = 'en', keysToTranslate = []) {
    if (!obj || typeof obj !== 'object' || keysToTranslate.length === 0) return obj;

    const normalizedTarget = normalizeLanguageCode(targetLang);
    const normalizedSource = normalizeLanguageCode(sourceLang);
    
    if (normalizedTarget === normalizedSource) return obj;

    // Use backend endpoint for complex objects or large batches
    try {
      const response = await apiRequest(API_ENDPOINTS.translate.object, {
        method: 'POST',
        body: JSON.stringify({ obj, targetLang: normalizedTarget, sourceLang: normalizedSource, keysToTranslate })
      });

      if (response.success) {
        return response.data.translation;
      }
    } catch (error) {
      console.error('Object translation error:', error);
    }
    
    return obj; // Fallback
  }
}

const translationService = new TranslationService();
export default translationService;
