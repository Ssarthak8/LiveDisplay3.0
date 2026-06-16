import { Router } from 'express';
import { DisplayContentService } from '../services/display-content.service.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadDisplayImage } from '../middleware/upload.middleware.js';
import { getIO } from '../socket.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/display-content — Public (for TV display)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await DisplayContentService.getAll();
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// GET /api/display-content/active — Public (active only, for TV)
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await DisplayContentService.getActive();
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// POST /api/display-content/upload — SuperAdmin only
router.post('/upload', authenticate, authorize('superadmin'), (req: Request, res: Response, next: NextFunction) => {
  uploadDisplayImage(req, res, async (err: any) => {
    if (err) {
      return next(err);
    }
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
      }
      const title = req.body.title || req.file.originalname;
      const displayDuration = req.body.displayDuration ? Number(req.body.displayDuration) : 12;
      const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
      const content = await DisplayContentService.create(
        { title, imageUrl, displayDuration },
        req.user!.userId
      );
      getIO().emit('displayContent:updated');
      res.status(201).json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  });
});

// PUT /api/display-content/:id — SuperAdmin only
router.put('/:id', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await DisplayContentService.update(req.params.id as string, req.body, req.user!.userId);
    getIO().emit('displayContent:updated');
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// PUT /api/display-content/reorder — SuperAdmin only
router.put('/reorder/batch', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
    }
    await DisplayContentService.reorder(orderedIds, req.user!.userId);
    getIO().emit('displayContent:updated');
    res.json({ success: true, message: 'Content reordered' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/display-content/:id — SuperAdmin only
router.delete('/:id', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DisplayContentService.delete(req.params.id as string, req.user!.userId);
    getIO().emit('displayContent:updated');
    res.json({ success: true, message: 'Display content deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
