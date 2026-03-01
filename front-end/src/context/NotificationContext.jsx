import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = async () => {
        if (!isAuthenticated) return;
        
        try {
            const response = await notificationService.getUnreadCount();
            setUnreadCount(response.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            
            // Refresh count every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    const incrementCount = () => {
        setUnreadCount(prev => prev + 1);
    };

    const decrementCount = () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const resetCount = () => {
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            fetchUnreadCount,
            incrementCount,
            decrementCount,
            resetCount,
            loading
        }}>
            {children}
        </NotificationContext.Provider>
    );
};