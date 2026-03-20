import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const dropdownRef = useRef(null);
    const { unreadCount, fetchUnreadCount, decrementCount, resetCount } = useNotifications();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications(true);
        }
    }, [isOpen]);

    const fetchNotifications = async (reset = false) => {
        if (loading) return;
        
        setLoading(true);
        try {
            const currentPage = reset ? 1 : page;
            const response = await notificationService.getNotifications(currentPage);
            
            if (reset) {
                setNotifications(response.notifications);
                setPage(2);
            } else {
                setNotifications(prev => [...prev, ...response.notifications]);
                setPage(prev => prev + 1);
            }
            
            setHasMore(response.notifications.length === 20);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
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
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            resetCount();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'expense_added':
                return (
                    <div className="h-10 w-10 rounded-full bg-green-500/80 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'settlement_received':
            case 'settlement_made':
                return (
                    <div className="h-10 w-10 rounded-full bg-emerald-500/80 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                );
            case 'member_added':
                return (
                    <div className="h-10 w-10 rounded-full bg-purple-500/80 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
                        <svg className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                );
        }
    };

    const getNotificationLink = (notification) => {
        if (notification?.data?.groupId) {
            const groupId = notification.data.groupId;
            
            if (typeof groupId === 'string') {
                const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(groupId);
                if (isValidObjectId) {
                    return `/groups/${groupId}`;
                }
            }
            
            console.warn('Invalid groupId format:', groupId);
        }
        
        return '#';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full ring-2 ring-black/50">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown - Darker Theme */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 backdrop-blur-2xl bg-black/60 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/10 bg-black/40">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 transition font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 && !loading ? (
                            <div className="px-4 py-8 text-center">
                                <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="mt-2 text-sm text-white/40">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification, index) => {
                                    const linkTo = getNotificationLink(notification);
                                    return (
                                        <Link
                                            key={notification._id}
                                            to={linkTo}
                                            onClick={() => {
                                                if (!notification.isRead) {
                                                    handleMarkAsRead(notification._id);
                                                }
                                                setIsOpen(false);
                                            }}
                                            className={`block relative ${
                                                index !== notifications.length - 1 ? 'border-b border-white/5' : ''
                                            } ${
                                                !notification.isRead ? 'bg-white/5' : ''
                                            } hover:bg-white/10 transition-all`}
                                        >
                                            <div className="relative flex space-x-3 px-4 py-3">
                                                {getNotificationIcon(notification.type)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-white/60 line-clamp-2 mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-white/40 mt-1">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0 mt-2"></span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                                
                                {hasMore && (
                                    <button
                                        onClick={() => fetchNotifications(false)}
                                        disabled={loading}
                                        className="w-full px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-white/5 border-t border-white/10 transition font-medium"
                                    >
                                        {loading ? 'Loading...' : 'Load more'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-white/10 bg-black/40">
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block text-center text-sm text-emerald-400 hover:text-emerald-300 transition font-medium"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;