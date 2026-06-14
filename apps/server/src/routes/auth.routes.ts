import { Router } from 'express';
import { AuthService, AppError } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { LoginSchema } from '@room-scheduler/shared-types';
import { User } from '../models/User.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }
    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Incorrect current password', 400);
    }
    user.passwordHash = newPassword; // Will be hashed by userSchema.pre('save')
    user.mustChangePassword = false;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
