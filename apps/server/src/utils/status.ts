import type { ScheduleStatus } from '@room-scheduler/shared-types';

/**
 * Computes the current status of a schedule based on date and time.
 */
export function getScheduleStatus(date: string, startTime: string, endTime: string): ScheduleStatus {
  const now = new Date();
  const eventStart = combineDateAndTime(date, startTime);
  const eventEnd = combineDateAndTime(date, endTime);

  if (now < eventStart) return 'upcoming';
  if (now >= eventStart && now <= eventEnd) return 'ongoing';
  return 'completed';
}

/**
 * Combines a date string (YYYY-MM-DD) and time string (HH:MM) into a Date object.
 */
export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

/**
 * Gets today's date as a YYYY-MM-DD string.
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
