import API from './api';

export const notificationService = {
    // Get user's notifications
    getNotifications: async (page = 1, unreadOnly = false) => {
        try {
            const response = await API.get(`/notifications?page=${page}&unreadOnly=${unreadOnly}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch notifications' };
        }
    },

    // Get unread count
    getUnreadCount: async () => {
        try {
            const response = await API.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch unread count' };
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await API.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to mark as read' };
        }
    },

    // Mark all as read
    markAllAsRead: async () => {
        try {
            const response = await API.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to mark all as read' };
        }
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await API.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete notification' };
        }
    }
};