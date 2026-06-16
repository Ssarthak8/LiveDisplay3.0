import { Router } from 'express';
import { RoomService } from '../services/room.service.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { CreateRoomSchema, UpdateRoomSchema } from '@room-scheduler/shared-types';
import { getIO } from '../socket.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/rooms — Public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await RoomService.getAll();
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
});

// GET /api/rooms/:id — Public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await RoomService.getById(req.params.id as string);
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

// POST /api/rooms — Super Admin only
router.post('/', authenticate, authorize('superadmin'), validate(CreateRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await RoomService.create(req.body, req.user!.userId);
    getIO().emit('room:created', room as any);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

// PUT /api/rooms/:id — Super Admin only
router.put('/:id', authenticate, authorize('superadmin'), validate(UpdateRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await RoomService.update(req.params.id as string, req.body, req.user!.userId);
    getIO().emit('room:updated', room as any);
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rooms/:id — Super Admin only
router.delete('/:id', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await RoomService.delete(req.params.id as string, req.user!.userId);
    getIO().emit('room:deleted', { id: req.params.id as string });
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
