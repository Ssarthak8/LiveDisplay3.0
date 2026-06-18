import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoricalBooking extends Document {
  _id: mongoose.Types.ObjectId;
  bookedBy?: string;
  email?: string;
  mobileNo?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  hallName: string;
  purpose?: string;
  numberOfPeople: number;
  importBatchId: string;
  sourceFileName: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const historicalBookingSchema = new Schema<IHistoricalBooking>(
  {
    bookedBy: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    mobileNo: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    hallName: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    numberOfPeople: {
      type: Number,
      required: [true, 'Number of people is required'],
      min: [0, 'Number of people cannot be negative'],
      default: 0,
    },
    importBatchId: {
      type: String,
      required: [true, 'Import batch ID is required'],
      index: true,
    },
    sourceFileName: {
      type: String,
      required: [true, 'Source file name is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by user is required'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

historicalBookingSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

export const HistoricalBooking = mongoose.model<IHistoricalBooking>('HistoricalBooking', historicalBookingSchema);
