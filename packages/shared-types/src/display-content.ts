import { z } from 'zod';

export const ContentType = z.enum(['image', 'video', 'pdf', 'announcement']);
export type ContentType = z.infer<typeof ContentType>;

export const DisplayContentSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  displayDuration: z.number().int().min(5).max(120).default(12),
  contentType: ContentType.default('image'),
  createdBy: z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  })]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type DisplayContent = z.infer<typeof DisplayContentSchema>;

export const CreateDisplayContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  displayDuration: z.number().int().min(5).max(120).optional(),
  contentType: ContentType.optional(),
});

export type CreateDisplayContentInput = z.infer<typeof CreateDisplayContentSchema>;

export const UpdateDisplayContentSchema = z.object({
  title: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  displayDuration: z.number().int().min(5).max(120).optional(),
});

export type UpdateDisplayContentInput = z.infer<typeof UpdateDisplayContentSchema>;
