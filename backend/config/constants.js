// Application Constants

export const USER_ROLES = {
  USER: 'user',
  SCRAPPER: 'scrapper',
  ADMIN: 'admin'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const SCRAP_CATEGORIES = {
  METAL: 'metal',
  PLASTIC: 'plastic',
  PAPER: 'paper',
  ELECTRONIC: 'electronic',
  GLASS: 'glass',
  OTHER: 'other'
};

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10
};

export const ORDER_TYPES = {
  SCRAP_SELL: 'scrap_sell',
  CLEANING_SERVICE: 'cleaning_service'
};

export const PRICE_TYPES = {
  MATERIAL: 'material',
  SERVICE: 'service'
};

export const SERVICE_CATEGORIES = {
  HOME_CLEANING: 'home_cleaning',
  OFFICE_CLEANING: 'office_cleaning',
  DEBRIS_REMOVAL: 'debris_removal',
  GARAGE_CLEANING: 'garage_cleaning'
};

export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  PROMOTION: 'promotion'
};
