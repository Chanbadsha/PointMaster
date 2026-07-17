import { Server } from 'socket.io';
import env from '../config/env.js';

let io = null;

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.socketCorsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('match:join', (matchId) => {
      if (matchId) {
        socket.join(`match:${matchId}`);
        console.log(`Socket ${socket.id} joined match:${matchId}`);
      }
    });

    socket.on('match:leave', (matchId) => {
      if (matchId) {
        socket.leave(`match:${matchId}`);
        console.log(`Socket ${socket.id} left match:${matchId}`);
      }
    });

    socket.on('room:join', (roomId) => {
      if (roomId) {
        socket.join(`room:${roomId}`);
        console.log(`Socket ${socket.id} joined room:${roomId}`);
      }
    });

    socket.on('room:leave', (roomId) => {
      if (roomId) {
        socket.leave(`room:${roomId}`);
        console.log(`Socket ${socket.id} left room:${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.IO initialized');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
