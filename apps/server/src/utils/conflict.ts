import { Schedule } from '../models/Schedule.js';
import { Room } from '../models/Room.js';
import type { ConflictDetail } from '@room-scheduler/shared-types';

/**
 * Checks for scheduling conflicts in a given room for a specific date and time range.
 * 
 * Overlap logic: Two events overlap if:
 *   existingStart < newEnd AND existingEnd > newStart
 *
 * @param roomId - The room to check
 * @param date - The date (YYYY-MM-DD)
 * @param startTime - New event start time (HH:MM)
 * @param endTime - New event end time (HH:MM)
 * @param excludeScheduleId - Optional schedule ID to exclude (for updates)
 * @returns ConflictDetail if conflict found, null otherwise
 */
export async function checkConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<ConflictDetail | null> {
  // Build the conflict query
  const query: Record<string, unknown> = {
    roomId,
    date,
    // Overlap condition: existing event starts before new ends, and existing event ends after new starts
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  // Exclude current schedule when updating
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const conflicting = await Schedule.findOne(query)
    .populate('roomId', 'roomNumber building')
    .lean();

  if (!conflicting) return null;

  const room = conflicting.roomId as unknown as { roomNumber: string; building: string };

  return {
    scheduleId: String(conflicting._id),
    title: conflicting.title,
    date: conflicting.date,
    startTime: conflicting.startTime,
    endTime: conflicting.endTime,
    roomNumber: room.roomNumber,
    building: room.building,
    faculty: conflicting.faculty,
    roomCoordinator: conflicting.roomCoordinator,
    coordinatorMobileNumber: conflicting.coordinatorMobileNumber,
  };
}
