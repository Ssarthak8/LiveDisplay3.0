import mongoose, { Schema, Document } from 'mongoose';

export interface IDisplayContent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  displayDuration: number;
  contentType: 'image' | 'video' | 'pdf' | 'announcement';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const displayContentSchema = new Schema<IDisplayContent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    displayDuration: {
      type: Number,
      default: 12,
      min: [5, 'Duration must be at least 5 seconds'],
      max: [120, 'Duration must be at most 120 seconds'],
    },
    contentType: {
      type: String,
      enum: ['image', 'video', 'pdf', 'announcement'],
      default: 'image',
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

displayContentSchema.index({ displayOrder: 1 });
displayContentSchema.index({ isActive: 1, displayOrder: 1 });

displayContentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const DisplayContent = mongoose.model<IDisplayContent>('DisplayContent', displayContentSchema);
