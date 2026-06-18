const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const weekdayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getGreetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getLocalGreeting(date = new Date()): string {
  return getGreetingForHour(date.getHours());
}

export function toLocalCivilDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatCivilDate(civilDate: string): string {
  const parts = parseCivilDate(civilDate);
  if (!parts) return civilDate;

  return `${monthNames[parts.month - 1]} ${parts.day}, ${parts.year}`;
}

export function formatHomeDate(date = new Date()): string {
  return `${weekdayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;

  if (safeSeconds === 0) return '0 min';
  if (safeSeconds < 60) return '< 1 min';

  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatGoalDueLabel(daysRemaining: number, completed: boolean): string {
  if (completed) return 'Completed';
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining < 0) return `Overdue by ${pluralize(Math.abs(daysRemaining), 'day')}`;
  return `Due in ${pluralize(daysRemaining, 'day')}`;
}

export function calculateCivilDaysBetween(startDate: string, targetDate: string): number {
  const start = parseCivilDate(startDate);
  const target = parseCivilDate(targetDate);
  if (!start || !target) return 0;

  const startTime = Date.UTC(start.year, start.month - 1, start.day);
  const targetTime = Date.UTC(target.year, target.month - 1, target.day);

  return Math.round((targetTime - startTime) / 86_400_000);
}

function parseCivilDate(civilDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) return null;

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  if (parts.month < 1 || parts.month > 12) return null;

  const daysInMonth = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  if (parts.day < 1 || parts.day > daysInMonth) return null;

  return parts;
}
