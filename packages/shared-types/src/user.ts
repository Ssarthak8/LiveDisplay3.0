import { z } from 'zod';

export const UserRole = z.enum(['superadmin', 'admin', 'viewer']);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  _id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  department: z.string().min(1, 'Department is required'),
  role: UserRole,
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean().default(true),
  lastLogin: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  department: z.string().min(1, 'Department is required'),
  role: UserRole,
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

