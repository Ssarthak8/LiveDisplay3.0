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
import analyticsRoutes from './routes/analytics.routes.js';
import announcementRoutes from './routes/announcement.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
// Updated request body size limits to 50MB for Excel and media uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
