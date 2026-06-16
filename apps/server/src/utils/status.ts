import type { ScheduleStatus } from '@room-scheduler/shared-types';

/**
 * Computes the current status of a schedule based on date and time.
 */
export function getScheduleStatus(
  date: string,
  startTime: string,
  endTime: string,
  timezone?: string
): ScheduleStatus {
  const now = new Date();
  const eventStart = combineDateAndTime(date, startTime, timezone);
  const eventEnd = combineDateAndTime(date, endTime, timezone);

  if (now < eventStart) return 'upcoming';
  if (now >= eventStart && now <= eventEnd) return 'ongoing';
  return 'completed';
}

/**
 * Combines a date string (YYYY-MM-DD) and time string (HH:MM) into a Date object in a specific timezone.
 */
export function combineDateAndTime(date: string, time: string, timezone?: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  if (!timezone) {
    return new Date(year, month - 1, day, hours, minutes, 0);
  }

  try {
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(utcDate);
    const map = new Map(parts.map((p) => [p.type, p.value]));

    const tzYear = Number(map.get('year'));
    const tzMonth = Number(map.get('month'));
    const tzDay = Number(map.get('day'));
    let tzHour = Number(map.get('hour'));
    if (tzHour === 24) tzHour = 0;
    const tzMin = Number(map.get('minute'));

    const targetTime = Date.UTC(year, month - 1, day, hours, minutes, 0);
    const gotTime = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, 0);
    const diff = targetTime - gotTime;

    return new Date(utcDate.getTime() + diff);
  } catch (error) {
    // Fallback if timezone is invalid
    return new Date(year, month - 1, day, hours, minutes, 0);
  }
}

/**
 * Gets today's date as a YYYY-MM-DD string, relative to a specific timezone if provided.
 */
export function getTodayDate(timezone?: string): string {
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      });
      return formatter.format(new Date());
    } catch (error) {
      // Fallback to local on error
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
