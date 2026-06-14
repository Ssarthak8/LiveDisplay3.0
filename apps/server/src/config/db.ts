import mongoose from 'mongoose';
import { env } from './env.js';

let mongod: any = null;

export async function connectDB(): Promise<void> {
  let uri = env.MONGODB_URI;

  if (env.NODE_ENV === 'development') {
    try {
      console.log(`📡 Connecting to MongoDB at ${uri}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.warn('⚠️ Local MongoDB not running or timed out. Falling back to mongodb-memory-server...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongod = await MongoMemoryServer.create({
          instance: {
            dbName: 'room-scheduler',
          }
        });
        uri = mongod.getUri();
        console.log(`🚀 Started mongodb-memory-server at ${uri}`);
        await mongoose.connect(uri);
        console.log('✅ Connected to in-memory MongoDB successfully');
        
        // Auto-seed the in-memory database
        const { seedData } = await import('../utils/seed.js');
        await seedData();
      } catch (innerError) {
        console.error('❌ Failed to start and connect to in-memory MongoDB:', innerError);
        process.exit(1);
      }
    }
  } else {
    try {
      await mongoose.connect(uri);
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    console.log('🛑 In-memory MongoDB stopped');
  }
}
