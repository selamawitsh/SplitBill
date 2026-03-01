import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '../controllers/notification.controller.js';

const router = express.Router();

// All notification routes are protected
router.use(protect);

// Get user's notifications
router.get('/', getMyNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Mark single as read
router.put('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;