import Notification from '../models/Notification.model.js';
import { emitToUser } from '../socket/socket.js';

// @desc    Get user's notifications
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
        console.error('❌ Get notifications error:', error);
        res.status(500).json({ 
            message: 'Server error while fetching notifications' 
        });
    }
};

// @desc    Mark notification as read
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
            { returnDocument: 'after' } // Fixed deprecation warning
        );

        if (!notification) {
            return res.status(404).json({ 
                message: 'Notification not found' 
            });
        }

        // Emit socket event to update unread count
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });
        
        emitToUser(userId.toString(), 'unread_count_updated', { count: unreadCount });

        res.json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// @desc    Mark all notifications as read
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

        // Emit socket event to update unread count
        emitToUser(userId.toString(), 'unread_count_updated', { count: 0 });

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('❌ Mark all as read error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// @desc    Delete notification
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

        // Update unread count after deletion
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });
        
        emitToUser(userId.toString(), 'unread_count_updated', { count: unreadCount });

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('❌ Delete notification error:', error);
        res.status(500).json({ 
            message: 'Server error' 
        });
    }
};

// @desc    Get unread count
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
        console.error('❌ Get unread count error:', error);
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
        console.log('📝 Creating notification with data:', { 
            recipient, 
            type, 
            title, 
            data 
        });
        
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            data,
            priority
        });

        // Populate for real-time emit
        const populatedNotification = await Notification.findById(notification._id)
            .populate('data.actionBy', 'FullName')
            .populate('data.groupId', 'name');

        // Emit real-time notification via socket
        emitToUser(recipient.toString(), 'new_notification', populatedNotification);

        // Also emit unread count update
        const unreadCount = await Notification.countDocuments({
            recipient,
            isRead: false
        });
        
        emitToUser(recipient.toString(), 'unread_count_updated', { count: unreadCount });

        console.log(`✅ Notification created for user ${recipient}: ${title}`);
        return notification;
    } catch (error) {
        console.error('❌ Create notification error:', error);
        return null;
    }
};