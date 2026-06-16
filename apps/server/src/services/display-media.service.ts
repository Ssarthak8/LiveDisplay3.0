import { DisplayMedia } from '../models/DisplayMedia.js';
import { AuditService } from './audit.service.js';
import { AppError } from './auth.service.js';
import fs from 'fs';
import path from 'path';

export class DisplayMediaService {
  /**
   * Get all display media items ordered by displayOrder.
   */
  static async getAll() {
    return DisplayMedia.find()
      .populate('uploadedBy', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  }

  /**
   * Get only active display media items (for TV slideshow).
   */
  static async getActive() {
    return DisplayMedia.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
  }

  /**
   * Create a display media item.
   */
  static async create(
    data: { title: string; imageUrl: string },
    userId: string
  ) {
    // Auto-assign display order
    const maxOrder = await DisplayMedia.findOne().sort({ displayOrder: -1 }).lean();
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

    const media = await DisplayMedia.create({
      ...data,
      displayOrder,
      uploadedBy: userId,
    });

    await AuditService.log('DISPLAY_MEDIA_CREATED', userId, 'display-media', media._id.toString(), {
      title: data.title,
      imageUrl: data.imageUrl,
    });

    return media.toJSON();
  }

  /**
   * Update a display media item.
   */
  static async update(
    id: string,
    data: Partial<{ title: string; isActive: boolean; displayOrder: number }>,
    userId: string
  ) {
    const media = await DisplayMedia.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!media) throw new AppError('Display media not found', 404);

    await AuditService.log('DISPLAY_MEDIA_UPDATED', userId, 'display-media', id, {
      changes: data,
    });

    return media.toJSON();
  }

  /**
   * Delete a display media item and its file from disk.
   */
  static async delete(id: string, userId: string) {
    const media = await DisplayMedia.findById(id);
    if (!media) throw new AppError('Display media not found', 404);

    // Try to delete the file
    try {
      const filePath = path.resolve(media.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // File cleanup failure is non-critical
    }

    await DisplayMedia.findByIdAndDelete(id);

    await AuditService.log('DISPLAY_MEDIA_DELETED', userId, 'display-media', id, {
      title: media.title,
    });

    return { id };
  }

  /**
   * Reorder display media items.
   */
  static async reorder(orderedIds: string[], userId: string) {
    const updates = orderedIds.map((id, index) =>
      DisplayMedia.findByIdAndUpdate(id, { displayOrder: index })
    );
    await Promise.all(updates);

    await AuditService.log('DISPLAY_MEDIA_UPDATED', userId, 'display-media', null, {
      action: 'reorder',
      newOrder: orderedIds,
    });

    return { success: true };
  }
}
