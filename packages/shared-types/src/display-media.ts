import { z } from 'zod';

export const DisplayMediaSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  uploadedBy: z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  })]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type DisplayMedia = z.infer<typeof DisplayMediaSchema>;

export const CreateDisplayMediaSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
});

export type CreateDisplayMediaInput = z.infer<typeof CreateDisplayMediaSchema>;

export const UpdateDisplayMediaSchema = z.object({
  title: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export type UpdateDisplayMediaInput = z.infer<typeof UpdateDisplayMediaSchema>;
