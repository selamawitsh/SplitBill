import { Server } from 'socket.io';

let io;
const userSockets = new Map(); // userId -> socketId
const groupMembers = new Map(); // groupId -> Set of userIds

export const initializeSocket = (server) => {
    console.log('🔌 Initializing Socket.io server...');
    
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST']
        },
        transports: ['polling', 'websocket'], // Polling first, then upgrade
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 45000
    });

    // Socket connection handler
    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);
        let currentUserId = null;

        // Authenticate user
        socket.on('authenticate', (userId) => {
            if (userId) {
                currentUserId = userId.toString();
                userSockets.set(currentUserId, socket.id);
                socket.join(`user:${currentUserId}`);
                
                console.log(`✅ User ${currentUserId} authenticated (Socket: ${socket.id})`);
                
                // Confirm authentication
                socket.emit('authenticated', { 
                    userId: currentUserId, 
                    success: true,
                    message: 'Authentication successful'
                });
                
                // Broadcast online status to all other users
                socket.broadcast.emit('user_online', { userId: currentUserId });
                
                // Send current online users list to this user
                const onlineUsers = Array.from(userSockets.keys());
                socket.emit('current_online_users', onlineUsers);
            }
        });

        // Join a group room
        socket.on('join_group', (groupId) => {
            if (groupId && currentUserId) {
                socket.join(`group:${groupId}`);
                
                // Track group membership
                if (!groupMembers.has(groupId)) {
                    groupMembers.set(groupId, new Set());
                }
                groupMembers.get(groupId).add(currentUserId);
                
                console.log(`📢 User ${currentUserId} joined group ${groupId}`);
                
                // Send online users in this group
                const onlineInGroup = Array.from(groupMembers.get(groupId) || [])
                    .filter(id => userSockets.has(id));
                
                socket.emit('group_online_users', { 
                    groupId, 
                    users: onlineInGroup 
                });
                
                // Notify others in group
                socket.to(`group:${groupId}`).emit('user_online', { 
                    userId: currentUserId 
                });
            }
        });

        // Get online users in a group
        socket.on('get_online_users', (groupId) => {
            if (groupId) {
                const onlineInGroup = Array.from(groupMembers.get(groupId) || [])
                    .filter(id => userSockets.has(id));
                
                socket.emit('group_online_users', { 
                    groupId, 
                    users: onlineInGroup 
                });
            }
        });

        // Leave a group room
        socket.on('leave_group', (groupId) => {
            if (groupId) {
                socket.leave(`group:${groupId}`);
                
                if (currentUserId && groupMembers.has(groupId)) {
                    groupMembers.get(groupId).delete(currentUserId);
                }
                
                console.log(`👋 User ${currentUserId} left group ${groupId}`);
                
                // Notify others in group
                socket.to(`group:${groupId}`).emit('user_offline', { 
                    userId: currentUserId 
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected:', socket.id);
            
            if (currentUserId) {
                userSockets.delete(currentUserId);
                
                // Remove from all groups
                for (const [groupId, members] of groupMembers.entries()) {
                    if (members.has(currentUserId)) {
                        members.delete(currentUserId);
                        
                        // Notify group members
                        io.to(`group:${groupId}`).emit('user_offline', { 
                            userId: currentUserId 
                        });
                    }
                }
                
                // Broadcast offline status
                socket.broadcast.emit('user_offline', { userId: currentUserId });
                console.log(`🔴 User ${currentUserId} went offline`);
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });
    });

    console.log('✅ Socket.io server initialized');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Utility functions to emit events
export const emitToUser = (userId, event, data) => {
    const socketId = userSockets.get(userId.toString());
    if (socketId && io) {
        io.to(socketId).emit(event, data);
        return true;
    }
    return false;
};

export const emitToGroup = (groupId, event, data) => {
    if (io) {
        io.to(`group:${groupId}`).emit(event, data);
        return true;
    }
    return false;
};

export const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
        return true;
    }
    return false;
};

export const getOnlineUsersInGroup = (groupId) => {
    const members = groupMembers.get(groupId) || new Set();
    return Array.from(members).filter(userId => userSockets.has(userId));
};