import { Room } from '../models/Room.js';
import { Schedule } from '../models/Schedule.js';
import { AppError } from './auth.service.js';

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
  static async create(data: { roomNumber: string; building: string; capacity: number }) {
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
    return room.toJSON();
  }

  /**
   * Update an existing room.
   */
  static async update(id: string, data: Partial<{ roomNumber: string; building: string; capacity: number }>) {
    const room = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!room) throw new AppError('Room not found', 404);
    return room.toJSON();
  }

  /**
   * Delete a room. Checks for associated schedules first.
   */
  static async delete(id: string) {
    const schedulesCount = await Schedule.countDocuments({ roomId: id });
    if (schedulesCount > 0) {
      throw new AppError(
        `Cannot delete room: ${schedulesCount} schedule(s) are associated with it. Delete or reassign them first.`,
        409
      );
    }
    const room = await Room.findByIdAndDelete(id);
    if (!room) throw new AppError('Room not found', 404);
    return room.toJSON();
  }
}
