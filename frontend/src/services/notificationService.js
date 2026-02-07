import { API_ENDPOINTS, API_BASE_URL } from '../config/apiConfig';
import { apiRequest } from '../modules/shared/utils/api';

/**
 * Notification Service for fetching real-time notifications from backend
 */
const notificationService = {
    /**
     * Get all notifications with pagination
     */
    getAll: async (page = 1, limit = 20) => {
        try {
            // If API_ENDPOINTS doesn't have notifications yet, use direct URL
            const endpoint = API_ENDPOINTS.notifications || `${API_BASE_URL}/api/v1/notifications`;
            const response = await apiRequest(`${endpoint}?page=${page}&limit=${limit}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark a single notification as read
     */
    markAsRead: async (id) => {
        try {
            const endpoint = API_ENDPOINTS.notifications || `${API_BASE_URL}/api/v1/notifications`;
            const response = await apiRequest(`${endpoint}/${id}/read`, {
                method: 'PUT'
            });
            return response;
        } catch (error) {
            console.error('Failed to mark notification read:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
        try {
            const endpoint = API_ENDPOINTS.notifications || `${API_BASE_URL}/api/v1/notifications`;
            const response = await apiRequest(`${endpoint}/read-all`, {
                method: 'PUT'
            });
            return response;
        } catch (error) {
            console.error('Failed to mark all notifications read:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get unread count (convenience method wrapping getAll)
     */
    getUnreadCount: async () => {
        try {
            const response = await notificationService.getAll(1, 1);
            if (response.success) {
                return response.data.unreadCount || 0;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }
};

export default notificationService;
