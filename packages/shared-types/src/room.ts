import { z } from 'zod';

export const RoomSchema = z.object({
  _id: z.string(),
  roomNumber: z.string().min(1, 'Room number is required'),
  building: z.string().min(1, 'Building is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Room = z.infer<typeof RoomSchema>;

export const CreateRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  building: z.string().min(1, 'Building is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export const UpdateRoomSchema = CreateRoomSchema.partial();

export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;
