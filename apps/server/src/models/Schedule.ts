import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: 'Lecture' | 'Meeting' | 'Training' | 'Seminar';
  faculty: string;
  roomId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description: string;
  roomCoordinator: string;
  coordinatorMobileNumber: string;
  assignedUsers: mongoose.Types.ObjectId[];
  assignedDepartment: string | null;
  assignedGroups: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Lecture', 'Meeting', 'Training', 'Seminar'],
      required: [true, 'Event type is required'],
    },
    faculty: {
      type: String,
      required: [true, 'Faculty/Presenter is required'],
      trim: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    description: {
      type: String,
      default: '',
    },
    roomCoordinator: {
      type: String,
      required: [true, 'Room Coordinator is required'],
      trim: true,
    },
    coordinatorMobileNumber: {
      type: String,
      required: [true, 'Mobile Number is required'],
      trim: true,
    },
    assignedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    assignedDepartment: {
      type: String,
      default: null,
    },
    assignedGroups: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
scheduleSchema.index({ roomId: 1, date: 1 });
scheduleSchema.index({ date: 1, startTime: 1, endTime: 1 });
scheduleSchema.index({ faculty: 1 });
scheduleSchema.index({ title: 'text', faculty: 'text' });

scheduleSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);
