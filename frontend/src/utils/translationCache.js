const DB_NAME = 'TranslationCache';
const DB_VERSION = 1;
const STORE_NAME = 'translations';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class TranslationCache {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async get(key) {
    await this.initPromise;
    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp < CACHE_TTL)) {
          resolve(result.translation);
        } else {
          if (result) this.delete(key); // Cleanup expired
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  async set(key, translation) {
    if (!translation || translation === key.split('_').pop()) return; // Don't cache failed or same translations

    await this.initPromise;
    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const data = {
        id: key,
        translation,
        timestamp: Date.now()
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  async delete(key) {
    await this.initPromise;
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
  }

  async clearExpired() {
    await this.initPromise;
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (Date.now() - cursor.value.timestamp > CACHE_TTL) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  getCacheKey(text, targetLang, sourceLang = 'en') {
    const normalizedText = text.trim();
    // Using btoa for simple base64 encoding of the text part of the key
    try {
      return `${sourceLang}_${targetLang}_${btoa(unescape(encodeURIComponent(normalizedText)))}`;
    } catch (e) {
      return `${sourceLang}_${targetLang}_${normalizedText.substring(0, 50)}`;
    }
  }
}

const translationCache = new TranslationCache();

// Periodically cleanup expired entries
setInterval(() => {
  translationCache.clearExpired();
}, 60 * 60 * 1000); // Every hour

export default translationCache;
