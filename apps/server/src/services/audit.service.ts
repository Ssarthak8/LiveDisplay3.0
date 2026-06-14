import { AuditLog } from '../models/AuditLog.js';

export class AuditService {
  /**
   * Create an audit log entry.
   */
  static async log(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    performedBy: string,
    scheduleId: string | null,
    details?: Record<string, unknown>
  ) {
    return AuditLog.create({
      action,
      performedBy,
      scheduleId,
      details: details || {},
      timestamp: new Date(),
    });
  }

  /**
   * Get paginated audit logs.
   */
  static async getLogs(
    page: number = 1,
    limit: number = 20,
    filters?: { action?: string; startDate?: string; endDate?: string }
  ) {
    const query: Record<string, unknown> = {};

    if (filters?.action) {
      query.action = filters.action;
    }

    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        (query.timestamp as Record<string, unknown>).$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (query.timestamp as Record<string, unknown>).$lte = new Date(`${filters.endDate}T23:59:59.999Z`);
      }
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email')
      .populate('scheduleId', 'title')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
