import { Room } from '../models/Room.js';
import { Schedule } from '../models/Schedule.js';
import { AuditService } from './audit.service.js';
import { AppError } from './auth.service.js';
import { ROOM_MASTER_DATA, RoomName } from '@room-scheduler/shared-types';

export class RoomService {
  /**
   * Get all rooms.
   */
  static async getAll() {
    return Room.find().sort({ building: 1, roomNumber: 1 }).lean();
  }

  /**
   * Get a single room by ID.
   */
  static async getById(id: string) {
    const room = await Room.findById(id).lean();
    if (!room) throw new AppError('Room not found', 404);
    return room;
  }

  /**
   * Create a new room.
   */
  static async create(data: { roomNumber: string; building: string; capacity: number }, userId: string) {
    // Validate room number is in master data
    if (!(data.roomNumber in ROOM_MASTER_DATA)) {
      throw new AppError(`Room number '${data.roomNumber}' is not a valid room.`, 400);
    }

    // Force/validate capacity matches master data
    const expectedCapacity = ROOM_MASTER_DATA[data.roomNumber as RoomName];
    if (data.capacity !== expectedCapacity) {
      throw new AppError(`Capacity for room ${data.roomNumber} must be ${expectedCapacity}.`, 400);
    }

    // Check for duplicates
    const existing = await Room.findOne({
      roomNumber: data.roomNumber,
      building: data.building,
    });
    if (existing) {
      throw new AppError(
        `Room ${data.roomNumber} already exists in ${data.building}`,
        409
      );
    }
    const room = await Room.create(data);

    // Log audit
    await AuditService.log('ROOM_CREATED', userId, 'room', room._id.toString(), {
      roomNumber: data.roomNumber,
      building: data.building,
      capacity: data.capacity,
    });

    return room.toJSON();
  }

  /**
   * Update an existing room.
   */
  static async update(id: string, data: Partial<{ roomNumber: string; building: string; capacity: number }>, userId: string) {
    const existingRoom = await Room.findById(id);
    if (!existingRoom) throw new AppError('Room not found', 404);

    const updatedRoomNumber = data.roomNumber !== undefined ? data.roomNumber : existingRoom.roomNumber;
    const updatedCapacity = data.capacity !== undefined ? data.capacity : existingRoom.capacity;

    // Validate room number is in master data
    if (!(updatedRoomNumber in ROOM_MASTER_DATA)) {
      throw new AppError(`Room number '${updatedRoomNumber}' is not a valid room.`, 400);
    }

    // Force/validate capacity matches master data
    const expectedCapacity = ROOM_MASTER_DATA[updatedRoomNumber as RoomName];
    if (updatedCapacity !== expectedCapacity) {
      throw new AppError(`Capacity for room ${updatedRoomNumber} must be ${expectedCapacity}.`, 400);
    }

    const room = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!room) throw new AppError('Room not found', 404);

    // Log audit
    await AuditService.log('ROOM_UPDATED', userId, 'room', id, {
      changes: data,
    });

    return room.toJSON();
  }

  /**
   * Delete a room. Checks for associated schedules first.
   */
  static async delete(id: string, userId: string) {
    const schedulesCount = await Schedule.countDocuments({ roomId: id });
    if (schedulesCount > 0) {
      throw new AppError(
        `Cannot delete room: ${schedulesCount} schedule(s) are associated with it. Delete or reassign them first.`,
        409
      );
    }
    const room = await Room.findByIdAndDelete(id);
    if (!room) throw new AppError('Room not found', 404);

    // Log audit
    await AuditService.log('ROOM_DELETED', userId, 'room', id, {
      roomNumber: room.roomNumber,
      building: room.building,
    });

    return room.toJSON();
  }
}
