import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  priority: 'Normal' | 'Important';
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important'],
      default: 'Normal',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
