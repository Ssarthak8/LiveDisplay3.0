import { z } from 'zod';

export const AuditAction = z.enum([
  'CREATE', 'UPDATE', 'DELETE',
  'SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED',
  'ROOM_CREATED', 'ROOM_UPDATED', 'ROOM_DELETED',
  'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED', 'PASSWORD_RESET',
  'DISPLAY_CONTENT_CREATED', 'DISPLAY_CONTENT_UPDATED', 'DISPLAY_CONTENT_DELETED',
  'DISPLAY_MEDIA_CREATED', 'DISPLAY_MEDIA_UPDATED', 'DISPLAY_MEDIA_DELETED',
  'ANALYTICS_VIEW', 'ANALYTICS_EXPORT', 'ANALYTICS_UPLOAD', 'ANALYTICS_UPLOAD_DELETE',
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const ResourceType = z.enum(['schedule', 'room', 'user', 'display-content', 'display-media', 'analytics']);
export type ResourceType = z.infer<typeof ResourceType>;

export const AuditLogSchema = z.object({
  _id: z.string(),
  action: AuditAction,
  performedBy: z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  })]),
  performedByName: z.string().optional(),
  performedByEmail: z.string().optional(),
  performedByRole: z.string().optional(),
  resourceType: ResourceType.optional(),
  resourceId: z.string().optional().nullable(),
  // Legacy field — kept for backward compatibility
  scheduleId: z.union([z.string(), z.object({
    _id: z.string(),
    title: z.string(),
  })]).optional().nullable(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
