import { Router } from 'express';
import { AuditService } from '../services/audit.service.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/audit-logs — Admin & Super Admin only
router.get('/', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const filters = {
      action: req.query.action as string,
      resourceType: req.query.resourceType as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };
    const result = await AuditService.getLogs(page, limit, filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
