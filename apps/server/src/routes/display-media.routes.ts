import { Router } from 'express';
import { DisplayMediaService } from '../services/display-media.service.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { uploadDisplayMedia } from '../middleware/upload.middleware.js';
import { getIO } from '../socket.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/display-media — Public with optional auth for active vs all
router.get('/', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active === 'true';
    let content;
    if (activeOnly) {
      content = await DisplayMediaService.getActive();
    } else if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
      content = await DisplayMediaService.getAll();
    } else {
      // Default to active for public/viewer clients
      content = await DisplayMediaService.getActive();
    }
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// GET /api/display-media/active — Public (active only)
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await DisplayMediaService.getActive();
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// POST /api/display-media — SuperAdmin only (upload image)
router.post('/', authenticate, authorize('superadmin'), (req: Request, res: Response, next: NextFunction) => {
  uploadDisplayMedia(req, res, async (err: any) => {
    if (err) {
      return next(err);
    }
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
      }
      const title = req.body.title || req.file.originalname;
      const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
      const content = await DisplayMediaService.create(
        { title, imageUrl },
        req.user!.userId
      );
      getIO().emit('displayMedia:updated');
      res.status(201).json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  });
});

// PUT /api/display-media/reorder — SuperAdmin only (reorder sequence)
router.put('/reorder', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
    }
    await DisplayMediaService.reorder(orderedIds, req.user!.userId);
    getIO().emit('displayMedia:updated');
    res.json({ success: true, message: 'Display media reordered' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/display-media/:id — SuperAdmin only (update active status / title)
router.put('/:id', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await DisplayMediaService.update(req.params.id as string, req.body, req.user!.userId);
    getIO().emit('displayMedia:updated');
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/display-media/:id — SuperAdmin only (delete image)
router.delete('/:id', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DisplayMediaService.delete(req.params.id as string, req.user!.userId);
    getIO().emit('displayMedia:updated');
    res.json({ success: true, message: 'Display media deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
