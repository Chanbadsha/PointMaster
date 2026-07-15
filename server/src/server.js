import { createServer } from 'node:http';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './database/index.js';
import { initializeSocket } from './sockets/index.js';

const server = createServer(app);

async function start() {
  try {
    await connectDatabase();

    initializeSocket(server);

    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
