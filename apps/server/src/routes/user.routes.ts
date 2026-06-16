import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { CreateUserSchema, UpdateUserSchema } from '@room-scheduler/shared-types';
import { AppError } from '../services/auth.service.js';
import { AuditService } from '../services/audit.service.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/users — Super Admin only (supports pagination & search)
router.get('/', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users — Super Admin only
router.post('/', authenticate, authorize('superadmin'), validate(CreateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...userData } = req.body;
    
    // Check if email already exists
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({
      ...userData,
      passwordHash: password,
      mustChangePassword: true, // Default forced update on first login
    });

    // Audit log
    await AuditService.log('USER_CREATED', req.user!.userId, 'user', user._id.toString(), {
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });

    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id — Super Admin only
router.put('/:id', authenticate, authorize('superadmin'), validate(UpdateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...userData } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email is being changed and is already taken
    if (userData.email && userData.email !== user.email) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        throw new AppError('Email already registered by another user', 400);
      }
    }

    // Track if user is being disabled
    const wasActive = user.isActive;
    const isBeingDisabled = userData.isActive === false && wasActive;

    // Assign fields
    Object.assign(user, userData);

    if (password) {
      user.passwordHash = password;
      user.mustChangePassword = true; // force reset if superadmin manually updates password
    }

    await user.save();

    // Audit log
    if (isBeingDisabled) {
      await AuditService.log('USER_DISABLED', req.user!.userId, 'user', req.params.id as string, {
        name: user.name,
        email: user.email,
      });
    } else {
      await AuditService.log('USER_UPDATED', req.user!.userId, 'user', req.params.id as string, {
        changes: Object.keys(userData),
      });
    }

    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/reset-password — Super Admin only
router.post('/:id/reset-password', authenticate, authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate random 8-character temporary password
    const tempPassword = 'Temp@' + Math.random().toString(36).slice(-5).toUpperCase();
    user.passwordHash = tempPassword; // hashed automatically by pre-save
    user.mustChangePassword = true;
    await user.save();

    // Audit log
    await AuditService.log('PASSWORD_RESET', req.user!.userId, 'user', req.params.id as string, {
      name: user.name,
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
