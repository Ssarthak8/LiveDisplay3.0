import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@room-scheduler/shared-types';
import { env } from './config/env.js';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join rooms based on client type
    socket.on('join:viewer', () => {
      socket.join('viewers');
      console.log(`👁️  Viewer joined: ${socket.id}`);
    });

    socket.on('join:tv', () => {
      socket.join('tv-displays');
      console.log(`📺 TV display joined: ${socket.id}`);
    });

    socket.on('join:admin', () => {
      socket.join('admins');
      console.log(`🔑 Admin joined: ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
}
