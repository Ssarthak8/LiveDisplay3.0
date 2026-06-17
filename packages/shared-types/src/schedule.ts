import { z } from 'zod';

export const EventType = z.enum(['Lecture', 'Meeting', 'Training', 'Seminar']);
export type EventType = z.infer<typeof EventType>;

export const ScheduleStatus = z.enum(['upcoming', 'ongoing', 'completed']);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

export const ScheduleSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, 'Title is required'),
  type: EventType,
  faculty: z.string().min(1, 'Faculty/Presenter is required'),
  roomId: z.union([z.string(), z.object({
    _id: z.string(),
    roomNumber: z.string(),
    building: z.string(),
    capacity: z.number(),
  })]),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().optional().default(''),
  roomCoordinator: z.string(),
  coordinatorMobileNumber: z.string(),
  assignedUsers: z.array(z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  })])).optional(),
  assignedDepartment: z.string().nullable().optional(),
  assignedGroups: z.array(z.string()).optional(),
  status: ScheduleStatus.optional(),
  createdBy: z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    department: z.string(),
  })]).optional().nullable(),
  updatedBy: z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
  })]).optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

export const CreateScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: EventType,
  faculty: z.string().min(1, 'Faculty/Presenter is required'),
  roomId: z.string().min(1, 'Room is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  description: z.string().optional().default(''),
  roomCoordinator: z.string().min(1, 'Room Coordinator is required'),
  coordinatorMobileNumber: z.string().regex(/^\d{10}$/, 'Mobile Number must be a 10-digit number'),
  assignedUsers: z.array(z.string()).optional(),
  assignedDepartment: z.string().nullable().optional(),
  assignedGroups: z.array(z.string()).optional(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'End time must be after start time', path: ['endTime'] }
);

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

export const UpdateScheduleSchema = z.object({
  title: z.string().min(1).optional(),
  type: EventType.optional(),
  faculty: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  description: z.string().optional(),
  roomCoordinator: z.string().min(1).optional(),
  coordinatorMobileNumber: z.string().regex(/^\d{10}$/, 'Mobile Number must be a 10-digit number').optional(),
  assignedUsers: z.array(z.string()).optional(),
  assignedDepartment: z.string().nullable().optional(),
  assignedGroups: z.array(z.string()).optional(),
});

export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

export const ConflictDetailSchema = z.object({
  scheduleId: z.string(),
  title: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  roomNumber: z.string(),
  building: z.string(),
  faculty: z.string(),
  roomCoordinator: z.string(),
  coordinatorMobileNumber: z.string(),
});

export type ConflictDetail = z.infer<typeof ConflictDetailSchema>;
