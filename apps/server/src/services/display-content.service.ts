import { DisplayContent } from '../models/DisplayContent.js';
import { AuditService } from './audit.service.js';
import { AppError } from './auth.service.js';
import fs from 'fs';
import path from 'path';

export class DisplayContentService {
  /**
   * Get all display content items ordered by displayOrder.
   */
  static async getAll() {
    return DisplayContent.find()
      .populate('createdBy', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  }

  /**
   * Get only active display content (for TV display).
   */
  static async getActive() {
    return DisplayContent.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
  }

  /**
   * Create a display content item (called after file upload).
   */
  static async create(
    data: { title: string; imageUrl: string; displayDuration?: number; contentType?: string },
    userId: string
  ) {
    // Auto-assign display order
    const maxOrder = await DisplayContent.findOne().sort({ displayOrder: -1 }).lean();
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

    const content = await DisplayContent.create({
      ...data,
      displayOrder,
      createdBy: userId,
    });

    await AuditService.log('DISPLAY_CONTENT_CREATED', userId, 'display-content', content._id.toString(), {
      title: data.title,
      imageUrl: data.imageUrl,
    });

    return content.toJSON();
  }

  /**
   * Update a display content item.
   */
  static async update(
    id: string,
    data: Partial<{ title: string; isActive: boolean; displayOrder: number; displayDuration: number }>,
    userId: string
  ) {
    const content = await DisplayContent.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!content) throw new AppError('Display content not found', 404);

    await AuditService.log('DISPLAY_CONTENT_UPDATED', userId, 'display-content', id, {
      changes: data,
    });

    return content.toJSON();
  }

  /**
   * Delete a display content item and its file.
   */
  static async delete(id: string, userId: string) {
    const content = await DisplayContent.findById(id);
    if (!content) throw new AppError('Display content not found', 404);

    // Try to delete the file
    try {
      const filePath = path.resolve(content.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // File cleanup failure is non-critical
    }

    await DisplayContent.findByIdAndDelete(id);

    await AuditService.log('DISPLAY_CONTENT_DELETED', userId, 'display-content', id, {
      title: content.title,
    });

    return { id };
  }

  /**
   * Reorder display content items.
   */
  static async reorder(orderedIds: string[], userId: string) {
    const updates = orderedIds.map((id, index) =>
      DisplayContent.findByIdAndUpdate(id, { displayOrder: index })
    );
    await Promise.all(updates);

    await AuditService.log('DISPLAY_CONTENT_UPDATED', userId, 'display-content', null, {
      action: 'reorder',
      newOrder: orderedIds,
    });

    return { success: true };
  }
}
