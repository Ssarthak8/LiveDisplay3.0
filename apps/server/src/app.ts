import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roomRoutes from './routes/room.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import auditRoutes from './routes/audit.routes.js';
import displayContentRoutes from './routes/display-content.routes.js';
import displayMediaRoutes from './routes/display-media.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/display-content', displayContentRoutes);
app.use('/api/display-media', displayMediaRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
