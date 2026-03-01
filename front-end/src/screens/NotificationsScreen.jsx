import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'
    const { fetchUnreadCount, decrementCount } = useNotifications();

    useEffect(() => {
        fetchNotifications(true);
    }, [filter]);

    const fetchNotifications = async (reset = false) => {
        if (loading && !reset) return;
        
        setLoading(true);
        try {
            const currentPage = reset ? 1 : page;
            const response = await notificationService.getNotifications(
                currentPage,
                filter === 'unread'
            );
            
            if (reset) {
                setNotifications(response.notifications);
                setPage(2);
            } else {
                setNotifications(prev => [...prev, ...response.notifications]);
                setPage(prev => prev + 1);
            }
            
            setHasMore(response.notifications.length === 20);
        } catch (error) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );
            decrementCount();
            toast.success('Notification marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            await fetchUnreadCount();
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (notificationId) => {
        if (!window.confirm('Delete this notification?')) return;
        
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            await fetchUnreadCount();
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'expense_added':
                return '💰';
            case 'settlement_received':
                return '💵';
            case 'settlement_made':
                return '💸';
            case 'member_added':
                return '👥';
            case 'member_removed':
                return '👋';
            case 'payment_reminder':
                return '⏰';
            case 'debt_reminder':
                return '⚠️';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'expense_added':
                return 'bg-blue-100 text-blue-600';
            case 'settlement_received':
                return 'bg-green-100 text-green-600';
            case 'settlement_made':
                return 'bg-yellow-100 text-yellow-600';
            case 'member_added':
                return 'bg-purple-100 text-purple-600';
            case 'member_removed':
                return 'bg-orange-100 text-orange-600';
            case 'payment_reminder':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getNotificationLink = (notification) => {
    // Validate that groupId exists and is a valid ObjectId string
    if (notification.data?.groupId && 
        typeof notification.data.groupId === 'string' && 
        notification.data.groupId.match(/^[0-9a-fA-F]{24}$/)) {
        return `/groups/${notification.data.groupId}`;
    }
    return '#'; // Return '#' if no valid ID
};

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="mt-2 text-gray-600">
                        Stay updated with your group activities
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                filter === 'all'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                filter === 'unread'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                        >
                            Unread
                        </button>
                    </div>
                    
                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {notifications.length === 0 && !loading ? (
                        <div className="px-6 py-16 text-center">
                            <div className="text-6xl mb-4">🔔</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No notifications
                            </h3>
                            <p className="text-gray-500">
                                {filter === 'unread' 
                                    ? "You don't have any unread notifications" 
                                    : "You're all caught up! Check back later for updates."}
                            </p>
                            {filter === 'unread' && (
                                <button
                                    onClick={() => setFilter('all')}
                                    className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    View all notifications
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-200">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-6 hover:bg-gray-50 transition ${
                                            !notification.isRead ? 'bg-blue-50/50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <Link
                                                            to={getNotificationLink(notification)}
                                                            className="block hover:opacity-75"
                                                            onClick={() => {
                                                                if (!notification.isRead) {
                                                                    handleMarkAsRead(notification._id);
                                                                }
                                                            }}
                                                        >
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {notification.message}
                                                            </p>
                                                        </Link>
                                                        
                                                        <div className="mt-2 flex items-center space-x-3 text-xs">
                                                            <span className="text-gray-400">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                            {notification.data?.amount && (
                                                                <>
                                                                    <span className="text-gray-300">•</span>
                                                                    <span className="font-medium text-primary-600">
                                                                        ETB {notification.data.amount.toFixed(2)}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {notification.type && (
                                                                <>
                                                                    <span className="text-gray-300">•</span>
                                                                    <span className="text-gray-400 capitalize">
                                                        {notification.type.replace(/_/g, ' ')}
                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    <div className="flex items-center space-x-2 ml-4">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification._id)}
                                                                className="p-1 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100"
                                                                title="Mark as read"
                                                            >
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(notification._id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                                                            title="Delete"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Load More */}
                            {hasMore && (
                                <div className="p-4 border-t border-gray-200">
                                    <button
                                        onClick={() => fetchNotifications()}
                                        disabled={loading}
                                        className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Loading...
                                            </div>
                                        ) : (
                                            'Load more notifications'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Back to Dashboard Link */}
                <div className="mt-6 text-center">
                    <Link
                        to="/dashboard"
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotificationsScreen;