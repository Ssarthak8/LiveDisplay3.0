import { Router } from 'express';
import { AnnouncementService } from '../services/announcement.service.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { getIO } from '../socket.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/announcements - Fetch all (Admin only) or active (public fallback)
router.get('/', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let announcements;
    if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
      announcements = await AnnouncementService.getAll();
    } else {
      announcements = await AnnouncementService.getActive();
    }
    res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
});

// GET /api/announcements/active - Public active list
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const announcements = await AnnouncementService.getActive();
    res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
});

// POST /api/announcements - Admin only
router.post('/', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, priority } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const announcement = await AnnouncementService.create(content, priority || 'Normal', req.user!.userId);
    getIO().emit('announcements:updated');
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

// PUT /api/announcements/:id - Admin only
router.put('/:id', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await AnnouncementService.update(req.params.id as string, req.body, req.user!.userId);
    getIO().emit('announcements:updated');
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/announcements/:id - Admin only
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AnnouncementService.delete(req.params.id as string, req.user!.userId);
    getIO().emit('announcements:updated');
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
