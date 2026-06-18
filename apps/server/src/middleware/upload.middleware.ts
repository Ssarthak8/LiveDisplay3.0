import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../services/auth.service.js';

const UPLOAD_DIR = 'uploads/display-content';
const MEDIA_UPLOAD_DIR = 'uploads/display-media';

// Ensure upload directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_UPLOAD_DIR)) {
  fs.mkdirSync(MEDIA_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `display-${uniqueSuffix}${ext}`);
  },
});

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, MEDIA_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPG, PNG, and WebP images are allowed', 400) as any);
  }
};

export const uploadDisplayImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Updated upload limit to 50MB
  },
}).single('image');

export const uploadDisplayMedia = multer({
  storage: mediaStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Updated upload limit to 50MB
  },
}).single('image');
