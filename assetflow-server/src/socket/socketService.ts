import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

class SocketService {
  private io: SocketIOServer | null = null;

  init(server: http.Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Allow users to join a personal room based on their userId to receive direct notifications
      socket.on('join_user', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`👤 Client ${socket.id} joined room user_${userId}`);
      });

      // Allow users to join a role room (e.g. ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD)
      socket.on('join_role', (role: string) => {
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
  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  // Emit event to a specific role
  emitToRole(role: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`role_${role}`).emit(event, data);
    }
  }

  // Emit event to all connected clients
  emitToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
