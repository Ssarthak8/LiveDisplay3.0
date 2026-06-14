import { createServer } from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { env } from './config/env.js';

async function start() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO
  initSocket(httpServer);

  // Start server
  const server = httpServer.listen(env.PORT, () => {
    console.log(`
🚀 Room Scheduler Server running!
📡 HTTP:   http://localhost:${env.PORT}
🔌 WS:    ws://localhost:${env.PORT}
🗄️  Mongo: ${env.MONGODB_URI}
🌍 Env:   ${env.NODE_ENV}
    `);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(async () => {
      console.log('📡 HTTP server closed');
      await disconnectDB();
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error('⚠️ Forcefully shutting down...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
