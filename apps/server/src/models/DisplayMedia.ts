import mongoose, { Schema, Document } from 'mongoose';

export interface IDisplayMedia extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const displayMediaSchema = new Schema<IDisplayMedia>(
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
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

displayMediaSchema.index({ displayOrder: 1 });
displayMediaSchema.index({ isActive: 1, displayOrder: 1 });

displayMediaSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const DisplayMedia = mongoose.model<IDisplayMedia>('DisplayMedia', displayMediaSchema);
