import { Schedule } from '../models/Schedule.js';
import { User } from '../models/User.js';
import { checkConflict } from '../utils/conflict.js';
import { getScheduleStatus, getTodayDate } from '../utils/status.js';
import { AuditService } from './audit.service.js';
import { AppError } from './auth.service.js';
import type { ScheduleFilters } from '@room-scheduler/shared-types';

export class ScheduleService {
  /**
   * Helper to strip privacy-sensitive fields for viewers and public requests.
   */
  private static stripPrivacy(schedule: any): any {
    if (!schedule) return schedule;
    
    // Create a copy to prevent mutating cache/mongoose document if lean is not used
    const cleaned = { ...schedule };
    delete cleaned.createdBy;
    delete cleaned.updatedBy;
    delete cleaned.description;
    delete cleaned.assignedUsers;
    delete cleaned.assignedDepartment;
    delete cleaned.assignedGroups;
    delete cleaned.roomCoordinator;
    delete cleaned.coordinatorMobileNumber;
    return cleaned;
  }

  /**
   * Helper to build viewer visibility filter.
   */
  private static async getVisibilityFilter(userContext?: { userId: string; role: string }): Promise<Record<string, any>> {
    if (!userContext || userContext.role !== 'viewer') {
      return {};
    }

    const user = await User.findById(userContext.userId).lean();
    if (!user) {
      return {};
    }

    return {
      $or: [
        { assignedUsers: user._id },
        { assignedDepartment: user.department },
        { assignedDepartment: { $in: [null, ''] } },
        { assignedDepartment: { $exists: false } },
      ],
    };
  }

  /**
   * Create a new schedule with conflict checking.
   */
  static async create(
    data: {
      title: string;
      type: string;
      faculty: string;
      roomId: string;
      date: string;
      startTime: string;
      endTime: string;
      roomCoordinator: string;
      coordinatorMobileNumber: string;
      description?: string;
      assignedUsers?: string[];
      assignedDepartment?: string | null;
    },
    userId: string
  ): Promise<any> {
    // Check for conflicts
    const conflict = await checkConflict(data.roomId, data.date, data.startTime, data.endTime);
    if (conflict) {
      const error: any = new AppError('Room booking conflict detected', 409);
      error.conflict = conflict;
      throw error;
    }

    const schedule = await Schedule.create({
      ...data,
      createdBy: userId,
    });

    // Log audit
    await AuditService.log('SCHEDULE_CREATED', userId, 'schedule', schedule._id.toString(), {
      title: data.title,
      room: data.roomId,
      date: data.date,
      time: `${data.startTime}-${data.endTime}`,
    });

    // Return populated schedule
    return this.getById(schedule._id.toString());
  }

  /**
   * Update an existing schedule with conflict checking.
   */
  static async update(
    id: string,
    data: Partial<{
      title: string;
      type: string;
      faculty: string;
      roomId: string;
      date: string;
      startTime: string;
      endTime: string;
      roomCoordinator: string;
      coordinatorMobileNumber: string;
      description: string;
      assignedUsers: string[];
      assignedDepartment: string | null;
    }>,
    userId: string
  ): Promise<any> {
    const existing = await Schedule.findById(id);
    if (!existing) throw new AppError('Schedule not found', 404);

    // If time/room/date changed, check for conflicts
    const checkRoom = data.roomId || existing.roomId.toString();
    const checkDate = data.date || existing.date;
    const checkStart = data.startTime || existing.startTime;
    const checkEnd = data.endTime || existing.endTime;

    const conflict = await checkConflict(checkRoom, checkDate, checkStart, checkEnd, id);
    if (conflict) {
      const error: any = new AppError('Room booking conflict detected', 409);
      error.conflict = conflict;
      throw error;
    }

    const updated = await Schedule.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );

    // Log audit
    await AuditService.log('SCHEDULE_UPDATED', userId, 'schedule', id, {
      changes: data,
    });

    return this.getById(id);
  }

  /**
   * Delete a schedule.
   */
  static async delete(id: string, userId: string) {
    const schedule = await Schedule.findById(id);
    if (!schedule) throw new AppError('Schedule not found', 404);

    await Schedule.findByIdAndDelete(id);

    // Log audit
    await AuditService.log('SCHEDULE_DELETED', userId, 'schedule', id, {
      title: schedule.title,
      date: schedule.date,
    });

    return { id };
  }

  /**
   * Get a single schedule by ID, fully populated.
   */
  static async getById(id: string, userContext?: { userId: string; role: string }, timezone?: string): Promise<any> {
    const schedule = await Schedule.findById(id)
      .populate('roomId', 'roomNumber building capacity')
      .populate('createdBy', 'name email phone department')
      .populate('updatedBy', 'name email')
      .lean();

    if (!schedule) throw new AppError('Schedule not found', 404);

    const enriched = {
      ...schedule,
      status: getScheduleStatus(schedule.date, schedule.startTime, schedule.endTime, timezone),
    };

    // Apply Privacy Strip for viewers and unauthenticated
    if (!userContext || userContext.role === 'viewer') {
      return this.stripPrivacy(enriched);
    }

    return enriched;
  }

  /**
   * Get paginated and filtered schedules.
   */
  static async getAll(filters: ScheduleFilters = {}, userContext?: { userId: string; role: string }, timezone?: string): Promise<any> {
    const query: Record<string, unknown> = {};
    const { search, roomId, type, status, date, startDate, endDate, page = 1, limit = 20 } = filters;

    // Search by title or faculty
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { faculty: { $regex: search, $options: 'i' } },
      ];
    }

    if (roomId) query.roomId = roomId;
    if (type) query.type = type;
    if (date) query.date = date;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = startDate;
      if (endDate) (query.date as Record<string, unknown>).$lte = endDate;
    }

    // Apply Viewer Visibility Filter
    const visibilityFilter = await this.getVisibilityFilter(userContext);
    const finalQuery = { ...query, ...visibilityFilter };

    const total = await Schedule.countDocuments(finalQuery);
    let schedules = await Schedule.find(finalQuery)
      .populate('roomId', 'roomNumber building capacity')
      .populate('createdBy', 'name email phone department')
      .populate('updatedBy', 'name email')
      .sort({ date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Compute status for each schedule
    let enriched = schedules.map((s) => ({
      ...s,
      status: getScheduleStatus(s.date, s.startTime, s.endTime, timezone),
    }));

    // Filter by status in-memory (since it's computed)
    if (status) {
      enriched = enriched.filter((s) => s.status === status);
    }

    // Apply Privacy Strip for viewers and unauthenticated
    if (!userContext || userContext.role === 'viewer') {
      enriched = enriched.map((s) => this.stripPrivacy(s));
    }

    return {
      data: enriched,
      total: status ? enriched.length : total,
      page,
      limit,
      totalPages: Math.ceil((status ? enriched.length : total) / limit),
    };
  }

  /**
   * Get today's schedules.
   */
  static async getToday(userContext?: { userId: string; role: string }, timezone?: string): Promise<any> {
    const today = getTodayDate(timezone);
    const query: Record<string, any> = { date: today };

    // Apply Viewer Visibility Filter
    const visibilityFilter = await this.getVisibilityFilter(userContext);
    const finalQuery = { ...query, ...visibilityFilter };

    const schedules = await Schedule.find(finalQuery)
      .populate('roomId', 'roomNumber building capacity')
      .populate('createdBy', 'name email phone department')
      .sort({ startTime: 1 })
      .lean();

    let enriched = schedules.map((s) => ({
      ...s,
      status: getScheduleStatus(s.date, s.startTime, s.endTime, timezone),
    }));

    // Apply Privacy Strip for viewers and unauthenticated
    if (!userContext || userContext.role === 'viewer') {
      enriched = enriched.map((s) => this.stripPrivacy(s));
    }

    return enriched;
  }

  /**
   * Get room availability for a specific date.
   */
  static async getRoomSchedules(roomId: string, date?: string, userContext?: { userId: string; role: string }, timezone?: string): Promise<any> {
    const query: Record<string, unknown> = { roomId };
    if (date) query.date = date;

    // Apply Viewer Visibility Filter
    const visibilityFilter = await this.getVisibilityFilter(userContext);
    const finalQuery = { ...query, ...visibilityFilter };

    const schedules = await Schedule.find(finalQuery)
      .populate('roomId', 'roomNumber building capacity')
      .sort({ date: 1, startTime: 1 })
      .lean();

    let enriched = schedules.map((s) => ({
      ...s,
      status: getScheduleStatus(s.date, s.startTime, s.endTime, timezone),
    }));

    // Apply Privacy Strip for viewers and unauthenticated
    if (!userContext || userContext.role === 'viewer') {
      enriched = enriched.map((s) => this.stripPrivacy(s));
    }

    return enriched;
  }

  /**
   * Get dashboard stats.
   */
  static async getStats(timezone?: string) {
    const today = getTodayDate(timezone);
    const now = new Date();

    const [totalRooms, todaySchedules] = await Promise.all([
      (await import('../models/Room.js')).Room.countDocuments(),
      Schedule.find({ date: today }).lean(),
    ]);

    let ongoingEvents = 0;
    let upcomingEvents = 0;

    for (const s of todaySchedules) {
      const status = getScheduleStatus(s.date, s.startTime, s.endTime, timezone);
      if (status === 'ongoing') ongoingEvents++;
      if (status === 'upcoming') upcomingEvents++;
    }

    return {
      totalRooms,
      totalSchedulesToday: todaySchedules.length,
      todayTotal: todaySchedules.length,
      ongoingEvents,
      ongoing: ongoingEvents,
      upcomingEvents,
      upcoming: upcomingEvents,
    };
  }
}
