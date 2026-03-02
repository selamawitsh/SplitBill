import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();

    // Initialize socket connection
    useEffect(() => {
        // Only connect if user is authenticated
        if (!isAuthenticated || !user?._id) {
            console.log('⏳ Waiting for authentication...');
            return;
        }

        console.log('🔌 Connecting to socket server for user:', user._id);

        // IMPORTANT: Use the correct URL - must match your backend
        const SOCKET_URL = 'http://localhost:4000'; // Use HTTP, not WS directly
        
        // Create socket connection with proper options
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            autoConnect: true,
            forceNew: true
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('✅ Socket connected! ID:', newSocket.id);
            setIsConnected(true);
            
            // Send authentication with user ID
            console.log('📤 Sending authenticate event for user:', user._id);
            newSocket.emit('authenticate', user._id);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            setIsConnected(false);
            
            // Try to reconnect if not intentional
            if (reason === 'io server disconnect') {
                // Reconnect manually
                newSocket.connect();
            }
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        // Authentication confirmation
        newSocket.on('authenticated', (data) => {
            console.log('✅ Socket authenticated successfully:', data);
        });

        // Handle user online status
        newSocket.on('user_online', ({ userId }) => {
            console.log('🟢 User online:', userId);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
        });

        newSocket.on('user_offline', ({ userId }) => {
            console.log('🔴 User offline:', userId);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        });

        // Get current online users in group
        newSocket.on('group_online_users', ({ groupId, users }) => {
            console.log(`📊 Online users in group ${groupId}:`, users);
            setOnlineUsers(new Set(users));
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up socket connection');
            if (newSocket) {
                newSocket.removeAllListeners();
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, user?._id]); // Re-run when auth changes

    // Join group room
    const joinGroup = useCallback((groupId) => {
        if (!groupId) return;
        
        if (socket && isConnected) {
            console.log('📢 Joining group room:', groupId);
            socket.emit('join_group', groupId);
            
            // Request current online users in this group
            setTimeout(() => {
                socket.emit('get_online_users', groupId);
            }, 500);
        } else {
            console.log('⚠️ Cannot join group - socket not ready. Will retry in 1 second...');
            // Retry after 1 second
            setTimeout(() => {
                if (socket && isConnected) {
                    console.log('📢 Retrying join group room:', groupId);
                    socket.emit('join_group', groupId);
                }
            }, 1000);
        }
    }, [socket, isConnected]);

    // Leave group room
    const leaveGroup = useCallback((groupId) => {
        if (socket && isConnected && groupId) {
            console.log('👋 Leaving group room:', groupId);
            socket.emit('leave_group', groupId);
        }
    }, [socket, isConnected]);

    // Check if user is online
    const isUserOnline = useCallback((userId) => {
        if (!userId) return false;
        return onlineUsers.has(userId.toString());
    }, [onlineUsers]);

    // Get online count in current group
    const getOnlineCount = useCallback((groupMembers) => {
        if (!groupMembers) return 0;
        return groupMembers.filter(m => onlineUsers.has(m.user?._id?.toString())).length;
    }, [onlineUsers]);

    return (
        <SocketContext.Provider value={{
            socket,
            onlineUsers: Array.from(onlineUsers),
            isConnected,
            joinGroup,
            leaveGroup,
            isUserOnline,
            getOnlineCount
        }}>
            {children}
        </SocketContext.Provider>
    );
};