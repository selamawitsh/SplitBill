import Notification from '../models/Notification.model.js';
import Group from '../models/Group.model.js';
import Expense from '../models/Expense.model.js';
import User from '../models/User.model.js';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const query = { recipient: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate('data.actionBy', 'FullName')
            .populate('data.groupId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(query);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching notifications' 
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ 
                message: 'Notification not found' 
            });
        }

        res.json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { 
                isRead: true, 
                readAt: new Date() 
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ 
                message: 'Notification not found' 
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// Helper function to create notifications (used by other controllers)
export const createNotification = async ({
    recipient,
    type,
    title,
    message,
    data = {},
    priority = 'medium'
}) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            data,
            priority
        });

        // TODO: Emit socket event for real-time notification
        // global.io.to(recipient.toString()).emit('newNotification', notification);

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
};