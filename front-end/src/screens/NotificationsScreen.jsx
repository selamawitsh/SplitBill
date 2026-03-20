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
    const [filter, setFilter] = useState('all');
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
            console.log(error)
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
            console.log(error)
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
            console.log(error)
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
            console.log(error)
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
                return 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40';
            case 'settlement_received':
                return 'bg-green-500/20 text-green-400 ring-2 ring-green-500/40';
            case 'settlement_made':
                return 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/40';
            case 'member_added':
                return 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/40';
            case 'member_removed':
                return 'bg-orange-500/20 text-orange-400 ring-2 ring-orange-500/40';
            case 'payment_reminder':
                return 'bg-red-500/20 text-red-400 ring-2 ring-red-500/40';
            default:
                return 'bg-white/20 text-white/70 ring-2 ring-white/30';
        }
    };

    const getNotificationLink = (notification) => {
        if (notification.data?.groupId && 
            typeof notification.data.groupId === 'string' && 
            notification.data.groupId.match(/^[0-9a-fA-F]{24}$/)) {
            return `/groups/${notification.data.groupId}`;
        }
        return '#';
    };

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Enhanced Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80">
                {/* Animated gradient orbs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main Glass Panel - Enhanced Transparency */}
                    <div className="relative backdrop-blur-2xl bg-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                        
                        {/* Inner Glow */}
                        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.08)] rounded-3xl pointer-events-none"></div>
                        
                        {/* Glass Edge Highlight */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                        {/* Header */}
                        <div className="px-8 pt-8 pb-4">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center space-x-2 text-white/50 hover:text-white/80 text-sm transition group"
                            >
                                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Back to Dashboard</span>
                            </Link>
                            <h1 className="text-4xl font-bold text-white mt-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                Notifications
                            </h1>
                            <p className="mt-2 text-white/40">
                                Stay updated with your group activities
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm ${
                                            filter === 'all'
                                                ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                                                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('unread')}
                                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm ${
                                            filter === 'unread'
                                                ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                                                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                                        }`}
                                    >
                                        Unread
                                    </button>
                                </div>
                                
                                {notifications.some(n => !n.isRead) && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-sm text-emerald-400 hover:text-emerald-300 transition font-medium px-3 py-1 rounded-lg hover:bg-white/5"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="px-4 pb-8">
                            {notifications.length === 0 && !loading ? (
                                <div className="px-6 py-16 text-center backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10">
                                    <div className="text-6xl mb-4 opacity-60">🔔</div>
                                    <h3 className="text-lg font-medium text-white mb-2">
                                        No notifications
                                    </h3>
                                    <p className="text-white/40">
                                        {filter === 'unread' 
                                            ? "You don't have any unread notifications" 
                                            : "You're all caught up! Check back later for updates."}
                                    </p>
                                    {filter === 'unread' && (
                                        <button
                                            onClick={() => setFilter('all')}
                                            className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
                                        >
                                            View all notifications
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                className={`group relative backdrop-blur-sm rounded-2xl transition-all duration-300 ${
                                                    !notification.isRead 
                                                        ? 'bg-white/10 border-l-2 border-emerald-400' 
                                                        : 'bg-white/5 hover:bg-white/10'
                                                } border border-white/10 overflow-hidden`}
                                            >
                                                {/* Hover Glow Effect */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none"></div>
                                                
                                                <div className="p-5">
                                                    <div className="flex items-start space-x-4">
                                                        {/* Icon */}
                                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl backdrop-blur-sm ${getNotificationColor(notification.type)}`}>
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <Link
                                                                        to={getNotificationLink(notification)}
                                                                        className="block hover:opacity-80 transition"
                                                                        onClick={() => {
                                                                            if (!notification.isRead) {
                                                                                handleMarkAsRead(notification._id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <p className="text-base font-semibold text-white">
                                                                            {notification.title}
                                                                        </p>
                                                                        <p className="text-sm text-white/60 mt-1 leading-relaxed">
                                                                            {notification.message}
                                                                        </p>
                                                                    </Link>
                                                                    
                                                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                                                        <span className="flex items-center space-x-1 text-white/40">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                                                        </span>
                                                                        {notification.data?.amount && (
                                                                            <>
                                                                                <span className="text-white/30">•</span>
                                                                                <span className="font-medium text-emerald-400 flex items-center space-x-1">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    <span>ETB {notification.data.amount.toFixed(2)}</span>
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                        {notification.type && (
                                                                            <>
                                                                                <span className="text-white/30">•</span>
                                                                                <span className="text-white/40 capitalize">
                                                                                    {notification.type.replace(/_/g, ' ')}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Actions */}
                                                                <div className="flex items-center space-x-1 ml-4">
                                                                    {!notification.isRead && (
                                                                        <button
                                                                            onClick={() => handleMarkAsRead(notification._id)}
                                                                            className="p-2 text-white/40 hover:text-emerald-400 rounded-xl hover:bg-white/10 transition-all"
                                                                            title="Mark as read"
                                                                        >
                                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDelete(notification._id)}
                                                                        className="p-2 text-white/40 hover:text-red-400 rounded-xl hover:bg-white/10 transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Load More */}
                                    {hasMore && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => fetchNotifications()}
                                                disabled={loading}
                                                className="w-full py-3 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-all backdrop-blur-sm bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"
                                            >
                                                {loading ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Loading...</span>
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
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.1);
                    }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
                .delay-1000 {
                    animation-delay: 1s;
                }
            `}</style>
        </div>
    );
};

export default NotificationsScreen;