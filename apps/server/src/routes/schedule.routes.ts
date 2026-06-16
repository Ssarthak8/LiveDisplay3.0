import { Router } from 'express';
import { ScheduleService } from '../services/schedule.service.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { CreateScheduleSchema, UpdateScheduleSchema } from '@room-scheduler/shared-types';
import { getIO } from '../socket.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/schedules — Public (filtered by optional user session)
router.get('/', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      search: req.query.search as string,
      roomId: req.query.roomId as string,
      type: req.query.type as string,
      status: req.query.status as string,
      date: req.query.date as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };
    const timezone = req.headers['x-timezone'] as string | undefined;
    const result = await ScheduleService.getAll(filters, req.user, timezone);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/schedules/today — Public (filtered by optional user session)
router.get('/today', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timezone = req.headers['x-timezone'] as string | undefined;
    const schedules = await ScheduleService.getToday(req.user, timezone);
    res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
});

// GET /api/schedules/stats — Admin only
router.get('/stats', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timezone = req.headers['x-timezone'] as string | undefined;
    const stats = await ScheduleService.getStats(timezone);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/schedules/room/:roomId — Public (filtered by optional user session)
router.get('/room/:roomId', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string | undefined;
    const timezone = req.headers['x-timezone'] as string | undefined;
    const schedules = await ScheduleService.getRoomSchedules(req.params.roomId as string, date, req.user, timezone);
    res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
});

// GET /api/schedules/:id — Public (filtered by optional user session)
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timezone = req.headers['x-timezone'] as string | undefined;
    const schedule = await ScheduleService.getById(req.params.id as string, req.user, timezone);
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
});

// POST /api/schedules — Admin and Super Admin only
router.post('/', authenticate, authorize('superadmin', 'admin'), validate(CreateScheduleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await ScheduleService.create(req.body, req.user!.userId);
    getIO().emit('schedule:created', schedule as any);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
});

// PUT /api/schedules/:id — Super Admin only
router.put('/:id', authenticate, authorize('superadmin'), validate(UpdateScheduleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await ScheduleService.update(req.params.id as string, req.body, req.user!.userId);
    getIO().emit('schedule:updated', schedule as any);
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/schedules/:id — Super Admin only
router.delete('/:id', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ScheduleService.delete(req.params.id as string, req.user!.userId);
    getIO().emit('schedule:deleted', { id: req.params.id as string });
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
