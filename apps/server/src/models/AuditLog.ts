import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: string;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  performedByEmail: string;
  performedByRole: string;
  resourceType: 'schedule' | 'room' | 'user' | 'display-content' | null;
  resourceId: string | null;
  // Legacy field kept for backward compatibility
  scheduleId: mongoose.Types.ObjectId | null;
  details: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    enum: [
      'CREATE', 'UPDATE', 'DELETE',
      'SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED',
      'ROOM_CREATED', 'ROOM_UPDATED', 'ROOM_DELETED',
      'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED', 'PASSWORD_RESET',
      'DISPLAY_CONTENT_CREATED', 'DISPLAY_CONTENT_UPDATED', 'DISPLAY_CONTENT_DELETED',
      'DISPLAY_MEDIA_CREATED', 'DISPLAY_MEDIA_UPDATED', 'DISPLAY_MEDIA_DELETED',
      'ANALYTICS_VIEW', 'ANALYTICS_EXPORT', 'ANALYTICS_UPLOAD', 'ANALYTICS_UPLOAD_DELETE',
    ],
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  performedByName: {
    type: String,
    default: '',
  },
  performedByEmail: {
    type: String,
    default: '',
  },
  performedByRole: {
    type: String,
    default: '',
  },
  resourceType: {
    type: String,
    enum: ['schedule', 'room', 'user', 'display-content', 'display-media', 'analytics', null],
    default: null,
  },
  resourceId: {
    type: String,
    default: null,
  },
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule',
    default: null,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ scheduleId: 1 });
auditLogSchema.index({ resourceType: 1, timestamp: -1 });

auditLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
