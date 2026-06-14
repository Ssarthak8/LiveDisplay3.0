import { z } from 'zod';

export const AuditAction = z.enum(['CREATE', 'UPDATE', 'DELETE']);
export type AuditAction = z.infer<typeof AuditAction>;

export const AuditLogSchema = z.object({
  _id: z.string(),
  action: AuditAction,
  performedBy: z.union([z.string(), z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  })]),
  scheduleId: z.union([z.string(), z.object({
    _id: z.string(),
    title: z.string(),
  })]).optional().nullable(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
