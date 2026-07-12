"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
class SocketService {
    io = null;
    init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
                credentials: true
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            // Allow users to join a personal room based on their userId to receive direct notifications
            socket.on('join_user', (userId) => {
                socket.join(`user_${userId}`);
                console.log(`👤 Client ${socket.id} joined room user_${userId}`);
            });
            // Allow users to join a role room (e.g. ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD)
            socket.on('join_role', (role) => {
                socket.join(`role_${role}`);
                console.log(`🎭 Client ${socket.id} joined room role_${role}`);
            });
            socket.on('disconnect', () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });
        return this.io;
    }
    getIO() {
        if (!this.io) {
            throw new Error('Socket.io not initialized');
        }
        return this.io;
    }
    // Emit event to a specific user
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit(event, data);
        }
    }
    // Emit event to a specific role
    emitToRole(role, event, data) {
        if (this.io) {
            this.io.to(`role_${role}`).emit(event, data);
        }
    }
    // Emit event to all connected clients
    emitToAll(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}
exports.socketService = new SocketService();
