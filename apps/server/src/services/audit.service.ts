import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';

export class AuditService {
  /**
   * Create an audit log entry with denormalized user information.
   */
  static async log(
    action: string,
    performedBy: string,
    resourceType: 'schedule' | 'room' | 'user' | 'display-content' | 'display-media' | 'analytics',
    resourceId: string | null,
    details?: Record<string, unknown>
  ) {
    // Lookup user for denormalization
    let performedByName = '';
    let performedByEmail = '';
    let performedByRole = '';
    try {
      const user = await User.findById(performedBy).select('name email role').lean();
      if (user) {
        performedByName = user.name;
        performedByEmail = user.email;
        performedByRole = user.role;
      }
    } catch {
      // Proceed even if user lookup fails
    }

    return AuditLog.create({
      action,
      performedBy,
      performedByName,
      performedByEmail,
      performedByRole,
      resourceType,
      resourceId,
      // Also store in legacy scheduleId field for backward compat
      scheduleId: resourceType === 'schedule' ? resourceId : null,
      details: details || {},
      timestamp: new Date(),
    });
  }

  /**
   * Get paginated audit logs with filtering.
   */
  static async getLogs(
    page: number = 1,
    limit: number = 20,
    filters?: { action?: string; startDate?: string; endDate?: string; resourceType?: string }
  ) {
    const query: Record<string, unknown> = {};

    if (filters?.action) {
      query.action = filters.action;
    } else {
      query.action = { $nin: ['ANALYTICS_VIEW', 'ANALYTICS_EXPORT'] };
    }

    if (filters?.resourceType) {
      query.resourceType = filters.resourceType;
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
      .populate('performedBy', 'name email role')
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
