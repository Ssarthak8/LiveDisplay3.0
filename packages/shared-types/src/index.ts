// User types
export { UserRole, UserSchema, CreateUserSchema, LoginSchema, UpdateUserSchema } from './user.js';
export type { User, CreateUserInput, LoginInput, UpdateUserInput } from './user.js';

// Room types
export { RoomSchema, CreateRoomSchema, UpdateRoomSchema } from './room.js';
export type { Room, CreateRoomInput, UpdateRoomInput } from './room.js';

// Schedule types
export { EventType, ScheduleStatus, ScheduleSchema, CreateScheduleSchema, UpdateScheduleSchema, ConflictDetailSchema } from './schedule.js';
export type { Schedule, CreateScheduleInput, UpdateScheduleInput, ConflictDetail } from './schedule.js';

// Audit types
export { AuditAction, AuditLogSchema } from './audit.js';
export type { AuditLog } from './audit.js';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  ConflictResponse,
  LoginResponse,
  DashboardStats,
  ScheduleFilters,
} from './api.js';

// Socket types
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './socket-events.js';
