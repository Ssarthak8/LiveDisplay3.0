/**
 * Format a date string (YYYY-MM-DD) for display.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a time string (HH:MM) for display.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get event type badge classes — corporate flat palette (no purple).
 */
export function getEventTypeColor(type: string): string {
  switch (type) {
    case 'Lecture':  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Meeting':  return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300';
    case 'Training': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'Seminar':  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    default:         return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300';
  }
}

/**
 * Get status badge CSS class (maps to .status-* in index.css).
 */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'ongoing':   return 'status-ongoing';
    case 'upcoming':  return 'status-upcoming';
    case 'completed': return 'status-completed';
    default:          return '';
  }
}

/**
 * Classnames helper — joins truthy class strings.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
