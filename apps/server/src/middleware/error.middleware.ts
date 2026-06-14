import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/auth.service.js';
import { env } from '../config/env.js';

/**
 * Global error handler middleware.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // AppError (known business errors)
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      message: err.message,
    };

    // Attach conflict details if present
    if ((err as any).conflict) {
      response.conflict = (err as any).conflict;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors: Record<string, string[]> = {};
    const mongooseErrors = (err as any).errors;
    for (const key in mongooseErrors) {
      errors[key] = [mongooseErrors[key].message];
    }
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Unknown errors
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
