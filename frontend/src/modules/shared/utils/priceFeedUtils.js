// Shared utilities for scrap price feed across Admin, User, and Scrapper modules
// Currently backed by localStorage key: 'adminPriceFeed'


export const PRICE_TYPES = {
  MATERIAL: 'material',
  SERVICE: 'service'
};

export const DEFAULT_PRICE_FEED = [
  { id: 'price_001', category: 'Plastic', pricePerKg: 45, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_002', category: 'Metal', pricePerKg: 180, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_003', category: 'Paper', pricePerKg: 12, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_004', category: 'Electronics', pricePerKg: 85, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_005', category: 'Copper', pricePerKg: 650, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_006', category: 'Aluminium', pricePerKg: 180, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_007', category: 'Steel', pricePerKg: 35, region: 'All', type: PRICE_TYPES.MATERIAL },
  { id: 'price_008', category: 'Brass', pricePerKg: 420, region: 'All', type: PRICE_TYPES.MATERIAL }
];

export const DEFAULT_SERVICE_FEED = [
  { id: 'srv_001', category: 'Home Cleaning', price: 1500, region: 'All', type: PRICE_TYPES.SERVICE, description: 'Basic home cleaning service' },
  { id: 'srv_002', category: 'Office Cleaning', price: 2500, region: 'All', type: PRICE_TYPES.SERVICE, description: 'Office space cleaning' },
  { id: 'srv_003', category: 'Garage Cleaning', price: 1000, region: 'All', type: PRICE_TYPES.SERVICE, description: 'Garage and storage cleaning' },
  { id: 'srv_004', category: 'Debris Removal', price: 2000, region: 'All', type: PRICE_TYPES.SERVICE, description: 'Construction or renovation debris removal' }
];

const STORAGE_KEY = 'adminPriceFeed';

/**
 * Load the raw admin-defined price feed from localStorage, if any.
 */
export const loadAdminPriceFeed = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (e) {
    console.error('Error reading admin price feed from localStorage', e);
    return null;
  }
};

/**
 * Get the effective price feed that the app should use everywhere.
 * - If admin has configured prices, use those.
 * - Otherwise fall back to DEFAULT_PRICE_FEED.
 */

export const getEffectivePriceFeed = () => {
  const adminFeed = loadAdminPriceFeed();
  if (adminFeed && adminFeed.length > 0) {
    return adminFeed.filter(p => !p.type || p.type === PRICE_TYPES.MATERIAL);
  }
  // Normalize default feed to include timestamps so admin UI and others can use them consistently
  const nowIso = new Date().toISOString();
  return DEFAULT_PRICE_FEED.map((p) => ({
    ...p,
    effectiveDate: p.effectiveDate || nowIso,
    updatedAt: p.updatedAt || nowIso
  }));
};

export const getEffectiveServiceFeed = () => {
  const adminFeed = loadAdminPriceFeed();
  if (adminFeed && adminFeed.length > 0) {
    return adminFeed.filter(p => p.type === PRICE_TYPES.SERVICE);
  }
  const nowIso = new Date().toISOString();
  return DEFAULT_SERVICE_FEED.map((p) => ({
    ...p,
    effectiveDate: p.effectiveDate || nowIso,
    updatedAt: p.updatedAt || nowIso
  }));
};


