import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  roomNumber: string;
  building: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
roomSchema.index({ roomNumber: 1, building: 1 }, { unique: true });

roomSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const Room = mongoose.model<IRoom>('Room', roomSchema);
