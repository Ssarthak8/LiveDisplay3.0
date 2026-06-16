import { z } from 'zod';

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ConflictResponse {
  success: false;
  message: string;
  conflict: {
    scheduleId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
    building: string;
    createdBy: {
      name: string;
      email: string;
      phone: string;
      department: string;
    };
  };
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  };
}

export interface DashboardStats {
  totalRooms: number;
  totalSchedulesToday: number;
  todayTotal: number;
  ongoingEvents: number;
  ongoing: number;
  upcomingEvents: number;
  upcoming: number;
}

export interface ScheduleFilters {
  search?: string;
  roomId?: string;
  type?: string;
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
