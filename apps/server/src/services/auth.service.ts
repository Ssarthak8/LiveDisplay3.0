import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User.js';
import { env } from '../config/env.js';

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export class AuthService {
  /**
   * Authenticate a user with email and password.
   */
  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  /**
   * Generate a JWT token for a user.
   */
  static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token.
   */
  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }

  /**
   * Get current user profile.
   */
  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated.', 403);
    }
    return user;
  }
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
