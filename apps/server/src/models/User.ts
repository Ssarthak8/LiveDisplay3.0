import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'superadmin' | 'admin' | 'viewer';
  passwordHash: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'viewer'],
      default: 'viewer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never return passwordHash in JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).passwordHash;
    delete (ret as any).__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
