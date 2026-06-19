import { Announcement } from '../models/Announcement.js';
import { AuditService } from './audit.service.js';
import { AppError } from './auth.service.js';

export class AnnouncementService {
  /**
   * Get all announcements ordered by creation date descending.
   */
  static async getAll() {
    return Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get active announcements sorted with Important ones first, then Normal ones, sorted by date.
   */
  static async getActive() {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return announcements.sort((a, b) => {
      if (a.priority === 'Important' && b.priority !== 'Important') return -1;
      if (a.priority !== 'Important' && b.priority === 'Important') return 1;
      return 0; // maintain createdAt descending from query
    });
  }

  /**
   * Create an announcement.
   */
  static async create(content: string, priority: 'Normal' | 'Important', userId: string) {
    const announcement = await Announcement.create({
      content,
      priority,
      createdBy: userId,
    });

    await AuditService.log('DISPLAY_CONTENT_CREATED', userId, 'display-content', announcement._id.toString(), {
      content,
      priority,
    });

    return announcement.toJSON();
  }

  /**
   * Update an announcement.
   */
  static async update(
    id: string,
    data: Partial<{ content: string; priority: 'Normal' | 'Important'; isActive: boolean }>,
    userId: string
  ) {
    const announcement = await Announcement.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!announcement) throw new AppError('Announcement not found', 404);

    await AuditService.log('DISPLAY_CONTENT_UPDATED', userId, 'display-content', id, {
      changes: data,
    });

    return announcement.toJSON();
  }

  /**
   * Delete an announcement.
   */
  static async delete(id: string, userId: string) {
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new AppError('Announcement not found', 404);

    await Announcement.findByIdAndDelete(id);

    await AuditService.log('DISPLAY_CONTENT_DELETED', userId, 'display-content', id, {
      content: announcement.content,
    });

    return { id };
  }
}
