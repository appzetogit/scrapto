export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api';

export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    loginOtp: '/auth/login-otp',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
    me: '/auth/me',
    profile: '/auth/profile',
    refreshToken: '/auth/refresh-token',
  },
  orders: {
    root: '/orders',
    my: '/orders/my-orders',
    byId: (id) => `/orders/${id}`,
    status: (id) => `/orders/${id}/status`,
    cancel: (id) => `/orders/${id}/cancel`,
    accept: (id) => `/orders/${id}/accept`,
    // Scrapper order endpoints
    available: '/orders/available',
    myAssigned: '/orders/my-assigned',
    // Admin order endpoints
    adminAll: '/admin/orders',
    adminById: (id) => `/admin/orders/${id}`,
    adminAssign: (id) => `/admin/orders/${id}/assign`,
    adminCancel: (id) => `/admin/orders/${id}/cancel`,
  },
  payments: {
    createOrder: '/payments/create-order',
    verify: '/payments/verify',
    status: (orderId) => `/payments/order/${orderId}/status`,
    mine: '/payments/my-payments',
  },
  wallet: {
    profile: '/wallet/profile',
    transactions: '/wallet/transactions',
    recharge: '/wallet/recharge/create',
    verifyRecharge: '/wallet/recharge/verify',
    payOrder: '/wallet/pay-order',
  },
  uploads: {
    orderImages: '/uploads/order-images',
    kycDocs: '/uploads/kyc-docs',
  },
  // Earnings endpoints (to be created in backend)
  earnings: {
    scrapperSummary: '/scrapper/earnings/summary',
    scrapperHistory: '/scrapper/earnings/history',
    adminScrapperEarnings: (scrapperId) => `/admin/scrappers/${scrapperId}/earnings`,
    adminAdjustEarnings: (scrapperId) => `/admin/scrappers/${scrapperId}/earnings/adjust`,
  },
  // Admin management endpoints
  admin: {
    dashboardStats: '/admin/dashboard/stats',
    analyticsPayments: '/admin/analytics/payments',
    users: '/admin/users',
    userById: (id) => `/admin/users/${id}`,
    userBlock: (id) => `/admin/users/${id}/block`,
    scrappers: '/admin/scrappers',
    scrapperById: (id) => `/admin/scrappers/${id}`,
    scrapperStatus: (id) => `/admin/scrappers/${id}/status`,
    prices: '/admin/prices',
    priceById: (id) => `/admin/prices/${id}`,
    subscriptionsAll: '/admin/subscriptions/all',
    subscriptionPlans: '/admin/subscriptions/plans',
    subscriptionPlanById: (id) => `/admin/subscriptions/plans/${id}`,
  },
  translate: {
    root: '/translate',
    batch: '/translate/batch',
    object: '/translate/object',
  },
};
