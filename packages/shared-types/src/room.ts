import { z } from 'zod';

export const ROOM_MASTER_DATA = {
  "Aap": 50,
  "Communication": 200,
  "CR6": 50,
  "Disha": 40,
  "Drishti": 50,
  "Pragati": 50,
  "Prathibha": 50,
  "Prithvi": 50,
  "Saksham": 50,
  "Sankalp": 50,
  "Sanwaad": 40,
  "Tej": 80,
  "Udaan": 50,
  "Vayu": 80
} as const;

export type RoomName = keyof typeof ROOM_MASTER_DATA;

export const RoomNames = Object.keys(ROOM_MASTER_DATA) as [string, ...string[]];

export const RoomSchema = z.object({
  _id: z.string(),
  roomNumber: z.enum(RoomNames, {
    errorMap: () => ({ message: 'Invalid room name. Must match the predefined Room Master Data.' })
  }),
  building: z.string().min(1, 'Building is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).refine(data => {
  return data.capacity === ROOM_MASTER_DATA[data.roomNumber as RoomName];
}, {
  message: "Capacity must match the predefined Room Master Data capacity.",
  path: ["capacity"]
});

export type Room = z.infer<typeof RoomSchema>;

export const CreateRoomSchema = z.object({
  roomNumber: z.enum(RoomNames, {
    errorMap: () => ({ message: 'Invalid room name. Must match the predefined Room Master Data.' })
  }),
  building: z.string().min(1, 'Building is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
}).refine(data => {
  return data.capacity === ROOM_MASTER_DATA[data.roomNumber as RoomName];
}, {
  message: "Capacity must match the predefined Room Master Data capacity.",
  path: ["capacity"]
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export const UpdateRoomSchema = z.object({
  roomNumber: z.enum(RoomNames, {
    errorMap: () => ({ message: 'Invalid room name. Must match the predefined Room Master Data.' })
  }).optional(),
  building: z.string().min(1, 'Building is required').optional(),
  capacity: z.number().int().positive('Capacity must be a positive number').optional(),
}).refine(data => {
  if (data.roomNumber && data.capacity) {
    return data.capacity === ROOM_MASTER_DATA[data.roomNumber as RoomName];
  }
  return true;
}, {
  message: "Capacity must match the predefined Room Master Data capacity.",
  path: ["capacity"]
});

export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;

