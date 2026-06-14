import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  performedBy: mongoose.Types.ObjectId;
  scheduleId: mongoose.Types.ObjectId | null;
  details: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

auditLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
