import type { Request, Response, NextFunction } from 'express';
import { AuthService, AppError } from '../services/auth.service.js';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
      };
    }
  }
}

/**
 * Authenticate JWT token from Authorization header.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
}

/**
 * Authorize specific roles.
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

/**
 * Optionally authenticate JWT token from Authorization header if present.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    }
    next();
  } catch (error: any) {
    // Statelessly proceed even if token is invalid or expired
    next();
  }
}
