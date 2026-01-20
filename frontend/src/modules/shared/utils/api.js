import { API_BASE_URL, API_ENDPOINTS } from '../../../config/apiConfig.js';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const isFormData = options.body instanceof FormData;

  // Build headers properly
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const apiError = new Error(data.error || data.message || 'Something went wrong');
      apiError.status = response.status;
      apiError.data = data;
      throw apiError;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    return apiRequest(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  login: async (email, password) => {
    return apiRequest(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  sendLoginOTP: async (phone, role = 'user') => {
    return apiRequest(API_ENDPOINTS.auth.loginOtp, {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  },
  verifyOTP: async (phone, otp, purpose = 'verification', role = null) => {
    const body = { phone, otp, purpose };
    if (role) body.role = role;
    return apiRequest(API_ENDPOINTS.auth.verifyOtp, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  resendOTP: async (phone) => {
    return apiRequest(API_ENDPOINTS.auth.resendOtp, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
  getMe: async () => {
    return apiRequest(API_ENDPOINTS.auth.me, {
      method: 'GET',
    });
  },
  updateProfile: async (profileData) => {
    return apiRequest(API_ENDPOINTS.auth.profile, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Order API
export const orderAPI = {
  create: async (payload) => {
    return apiRequest(API_ENDPOINTS.orders.root, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getMy: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.orders.my}${suffix}`, {
      method: 'GET',
    });
  },
  getById: async (id) => {
    return apiRequest(API_ENDPOINTS.orders.byId(id), {
      method: 'GET',
    });
  },
  updateStatus: async (id, status, paymentStatus = null, totalAmount = null) => {
    const body = { status };
    if (paymentStatus) body.paymentStatus = paymentStatus;
    if (totalAmount) body.totalAmount = totalAmount;
    return apiRequest(API_ENDPOINTS.orders.status(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  cancel: async (id, reason) => {
    return apiRequest(API_ENDPOINTS.orders.cancel(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  accept: async (id) => {
    return apiRequest(API_ENDPOINTS.orders.accept(id), {
      method: 'POST',
    });
  },
};

// Payment API
export const paymentAPI = {
  createPaymentOrder: async (orderId) => {
    return apiRequest(API_ENDPOINTS.payments.createOrder, {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },
  verifyPayment: async (payload) => {
    return apiRequest(API_ENDPOINTS.payments.verify, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getStatus: async (orderId) => {
    return apiRequest(API_ENDPOINTS.payments.status(orderId), {
      method: 'GET',
    });
  },
  getMyPayments: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.payments.mine}${suffix}`, {
      method: 'GET',
    });
  },
  createSubscriptionOrder: async ({ amount, planName, durationDays }) => {
    return apiRequest('/payments/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ amount, planName, durationDays }),
    });
  },
  verifySubscription: async (payload) => {
    return apiRequest('/payments/subscription/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Wallet API
export const walletAPI = {
  getWalletProfile: async () => {
    return apiRequest(API_ENDPOINTS.wallet.profile, { method: 'GET' });
  },
  getTransactions: async (page = 1, limit = 10) => {
    return apiRequest(`${API_ENDPOINTS.wallet.transactions}?page=${page}&limit=${limit}`, { method: 'GET' });
  },
  createRechargeOrder: async (amount) => {
    return apiRequest(API_ENDPOINTS.wallet.recharge, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
  verifyRecharge: async (paymentData) => {
    return apiRequest(API_ENDPOINTS.wallet.verifyRecharge, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  payOrderViaWallet: async (orderId, amount) => {
    return apiRequest(API_ENDPOINTS.wallet.payOrder, {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
  }
};

// Subscription API
export const subscriptionAPI = {
  getPlans: async () => {
    return apiRequest('/subscriptions/plans', { method: 'GET' });
  },
  getPlan: async (planId) => {
    return apiRequest(`/subscriptions/plans/${planId}`, { method: 'GET' });
  },
  getMySubscription: async () => {
    return apiRequest('/subscriptions/my-subscription', { method: 'GET' });
  },
  subscribe: async (planId) => {
    return apiRequest('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },
  verifyPayment: async (paymentData) => {
    return apiRequest('/subscriptions/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  cancel: async (reason = null) => {
    return apiRequest('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  renew: async (planId) => {
    return apiRequest('/subscriptions/renew', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },
  getHistory: async () => {
    return apiRequest('/subscriptions/history', { method: 'GET' });
  },
};

// Upload API
export const uploadAPI = {
  uploadOrderImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return apiRequest(API_ENDPOINTS.uploads.orderImages, {
      method: 'POST',
      body: formData,
    });
  },
  uploadKycDocs: async (fileMap = {}) => {
    const formData = new FormData();
    Object.entries(fileMap).forEach(([field, value]) => {
      if (Array.isArray(value)) value.forEach((f) => formData.append(field, f));
      else if (value) formData.append(field, value);
    });
    return apiRequest(API_ENDPOINTS.uploads.kycDocs, {
      method: 'POST',
      body: formData,
    });
  },
};

// KYC API
export const kycAPI = {
  submit: async (formData) => {
    return apiRequest('/kyc', {
      method: 'POST',
      body: formData,
    });
  },
  getMy: async () => {
    return apiRequest('/kyc/me', { method: 'GET' });
  },
};

// Scrapper Orders API
export const scrapperOrdersAPI = {
  getAvailable: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.orders.available}${suffix}`, { method: 'GET' });
  },
  getMyAssigned: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.orders.myAssigned}${suffix}`, { method: 'GET' });
  },
  accept: async (id) => {
    return apiRequest(API_ENDPOINTS.orders.accept(id), { method: 'POST' });
  },
};

// Admin Orders API
export const adminOrdersAPI = {
  getAll: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.orders.adminAll}${suffix}`, { method: 'GET' });
  },
  getById: async (id) => {
    return apiRequest(API_ENDPOINTS.orders.adminById(id), { method: 'GET' });
  },
  assign: async (id, scrapperId) => {
    return apiRequest(API_ENDPOINTS.orders.adminAssign(id), {
      method: 'POST',
      body: JSON.stringify({ scrapperId }),
    });
  },
  cancel: async (id, reason) => {
    return apiRequest(API_ENDPOINTS.orders.adminCancel(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Earnings API
export const earningsAPI = {
  getSummary: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.earnings.scrapperSummary}${suffix}`, { method: 'GET' });
  },
  getHistory: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.earnings.scrapperHistory}${suffix}`, { method: 'GET' });
  },
  getScrapperEarnings: async (scrapperId, query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`${API_ENDPOINTS.earnings.adminScrapperEarnings(scrapperId)}${suffix}`, { method: 'GET' });
  },
  adjustEarnings: async (scrapperId, adjustmentData) => {
    return apiRequest(API_ENDPOINTS.earnings.adminAdjustEarnings(scrapperId), {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  },
};

// Review API
export const reviewAPI = {
  create: async ({ orderId, scrapperId, rating, comment = null, title = null, tags = [], images = [] }) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({ orderId, scrapperId, rating, comment, title, tags, images }),
    });
  },
  getScrapperReviews: async (scrapperId, query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`/reviews/scrapper/${scrapperId}${suffix}`, { method: 'GET' });
  },
  getMyReviews: async (query = '') => {
    const suffix = query ? `?${query}` : '';
    return apiRequest(`/reviews/my-reviews${suffix}`, { method: 'GET' });
  },
  getById: async (reviewId) => {
    return apiRequest(`/reviews/${reviewId}`, { method: 'GET' });
  },
  update: async (reviewId, rating, comment = null, title = null, tags = [], images = []) => {
    return apiRequest(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment, title, tags, images }),
    });
  },
  delete: async (reviewId) => {
    return apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
  },
  flag: async (reviewId, reason = '') => {
    return apiRequest(`/reviews/${reviewId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Chat API
export const chatAPI = {
  getMyChats: async (query = '') => {
    return apiRequest(`/chats${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getOrCreate: async (orderId) => {
    return apiRequest(`/chats/order/${orderId}`, { method: 'GET' });
  },
  getMessages: async (chatId, page = 1, limit = 50) => {
    return apiRequest(`/chats/${chatId}/messages?page=${page}&limit=${limit}`, { method: 'GET' });
  },
  getChatById: async (chatId, query = '') => {
    return apiRequest(`/chats/order/${chatId}${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  createChat: async (orderId) => {
    return apiRequest(`/chats/order/${orderId}`, { method: 'GET' });
  },
  sendMessage: async (chatId, content, attachments = []) => {
    return apiRequest(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: content, attachments }),
    });
  },
  markAsRead: async (chatId) => {
    return apiRequest(`/chats/${chatId}/read`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
  archiveChat: async (chatId) => {
    return apiRequest(`/chats/${chatId}/archive`, { method: 'PUT' });
  },
  getUnreadCount: async () => {
    return apiRequest('/chats/unread-count', { method: 'GET' });
  },
};

// Admin API
export const adminAPI = {
  getScrappersWithKyc: async (query = '') => {
    return apiRequest(`/kyc/scrappers${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  verifyKyc: async (scrapperId) => {
    return apiRequest(`/kyc/${scrapperId}/verify`, { method: 'POST' });
  },
  rejectKyc: async (scrapperId, reason) => {
    return apiRequest(`/kyc/${scrapperId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  getDashboardStats: async () => {
    return apiRequest(API_ENDPOINTS.admin.dashboardStats, { method: 'GET' });
  },
  getPaymentAnalytics: async () => {
    return apiRequest(API_ENDPOINTS.admin.analyticsPayments, { method: 'GET' });
  },
  getAllUsers: async (query = '') => {
    return apiRequest(`${API_ENDPOINTS.admin.users}${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getUserById: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.userById(id), { method: 'GET' });
  },
  updateUser: async (id, userData) => {
    return apiRequest(API_ENDPOINTS.admin.userById(id), {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  blockUser: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.userBlock(id), { method: 'PATCH' });
  },
  deleteUser: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.userById(id), { method: 'DELETE' });
  },
  getAllScrappers: async (query = '') => {
    return apiRequest(`${API_ENDPOINTS.admin.scrappers}${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getScrapperById: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.scrapperById(id), { method: 'GET' });
  },
  updateScrapper: async (id, scrapperData) => {
    return apiRequest(API_ENDPOINTS.admin.scrapperById(id), {
      method: 'PUT',
      body: JSON.stringify(scrapperData),
    });
  },
  updateScrapperStatus: async (id, status) => {
    return apiRequest(API_ENDPOINTS.admin.scrapperStatus(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteScrapper: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.scrapperById(id), { method: 'DELETE' });
  },
  getAllPrices: async () => {
    return apiRequest(API_ENDPOINTS.admin.prices, { method: 'GET' });
  },
  createPrice: async (priceData) => {
    return apiRequest(API_ENDPOINTS.admin.prices, {
      method: 'POST',
      body: JSON.stringify(priceData),
    });
  },
  updatePrice: async (id, priceData) => {
    return apiRequest(API_ENDPOINTS.admin.priceById(id), {
      method: 'PUT',
      body: JSON.stringify(priceData),
    });
  },
  deletePrice: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.priceById(id), { method: 'DELETE' });
  },
  getAllSubscriptions: async () => {
    return apiRequest(API_ENDPOINTS.admin.subscriptionsAll, { method: 'GET' });
  },
  getAllSubscriptionPlans: async () => {
    return apiRequest(API_ENDPOINTS.admin.subscriptionPlans, { method: 'GET' });
  },
  createPlan: async (planData) => {
    return apiRequest(API_ENDPOINTS.admin.subscriptionPlans, {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },
  updatePlan: async (id, planData) => {
    return apiRequest(API_ENDPOINTS.admin.subscriptionPlanById(id), {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  },
  deletePlan: async (id) => {
    return apiRequest(API_ENDPOINTS.admin.subscriptionPlanById(id), { method: 'DELETE' });
  },
  getAllLeads: async (query = '') => {
    return apiRequest(`/admin/leads${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  createLead: async (leadData) => {
    return apiRequest('/admin/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },
  updateLead: async (id, leadData) => {
    return apiRequest(`/admin/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  },
  deleteLead: async (id) => {
    return apiRequest(`/admin/leads/${id}`, { method: 'DELETE' });
  },
  withdrawFunds: async (amount, notes) => {
    return apiRequest('/admin/finance/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, notes }),
    });
  },
  updateAdminBankDetails: async (bankDetails) => {
    return apiRequest('/admin/finance/bank-details', {
      method: 'PUT',
      body: JSON.stringify(bankDetails),
    });
  },
};

// Scrapper Profile API
export const scrapperProfileAPI = {
  getMyProfile: async () => {
    return apiRequest('/scrappers/me', { method: 'GET' });
  },
  updateMyProfile: async (profileData) => {
    return apiRequest('/scrappers/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  getPublicProfile: async (id) => {
    return apiRequest(`/scrappers/${id}/profile`, { method: 'GET' });
  },
};

// Banner API
export const bannerAPI = {
  getActive: async (audience = 'both') => {
    return apiRequest(`/banners/public?audience=${audience}`, { method: 'GET' });
  },
  getAllAdmin: async () => {
    return apiRequest('/banners/admin/all', { method: 'GET' });
  },
  create: async (formData) => {
    return apiRequest('/banners', {
      method: 'POST',
      body: formData,
    });
  },
  toggleStatus: async (id) => {
    return apiRequest(`/banners/${id}/status`, { method: 'PATCH' });
  },
  delete: async (id) => {
    return apiRequest(`/banners/${id}`, { method: 'DELETE' });
  }
};

// Support API
export const supportAPI = {
  create: async (ticketData) => {
    return apiRequest('/support', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },
  getMyTickets: async () => {
    return apiRequest('/support/my-tickets', { method: 'GET' });
  },
  getAllAdmin: async (query = '') => {
    return apiRequest(`/support/admin/all${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  updateStatus: async (id, status) => {
    return apiRequest(`/support/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Referral API
export const referralAPI = {
  getSettings: async () => {
    return apiRequest('/admin/referral-system/settings', { method: 'GET' });
  },
  updateSettings: async (settings) => {
    return apiRequest('/admin/referral-system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
  getAllTiers: async () => {
    return apiRequest('/admin/referral-system/tiers', { method: 'GET' });
  },
  createTier: async (tierData) => {
    return apiRequest('/admin/referral-system/tiers', {
      method: 'POST',
      body: JSON.stringify(tierData),
    });
  },
  updateTier: async (id, tierData) => {
    return apiRequest(`/admin/referral-system/tiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tierData),
    });
  },
  deleteTier: async (id) => {
    return apiRequest(`/admin/referral-system/tiers/${id}`, { method: 'DELETE' });
  },
  getAllMilestones: async () => {
    return apiRequest('/admin/referral-system/milestones', { method: 'GET' });
  },
  createMilestone: async (data) => {
    return apiRequest('/admin/referral-system/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteMilestone: async (id) => {
    return apiRequest(`/admin/referral-system/milestones/${id}`, { method: 'DELETE' });
  },
  getAllCampaigns: async () => {
    return apiRequest('/admin/referral-system/campaigns', { method: 'GET' });
  },
  createCampaign: async (data) => {
    return apiRequest('/admin/referral-system/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateCampaign: async (id, data) => {
    return apiRequest(`/admin/referral-system/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteCampaign: async (id) => {
    return apiRequest(`/admin/referral-system/campaigns/${id}`, { method: 'DELETE' });
  },
  getAllReferrals: async () => {
    return apiRequest('/admin/referral-system/all', { method: 'GET' });
  },
  updateReferral: async (id, status) => {
    return apiRequest(`/admin/referral-system/referrals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Public API (no auth required)
export const publicAPI = {
  getPrices: async () => {
    return apiRequest('/public/prices', { method: 'GET' });
  },
  getActivePrices: async () => {
    return apiRequest('/public/prices/active', { method: 'GET' });
  },
};

