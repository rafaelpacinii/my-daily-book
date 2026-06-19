import type { SupportedLocale } from '@/src/localization';

export function getGreetingForHour(hour: number, locale: SupportedLocale = 'en'): string {
  if (locale === 'pt-BR') {
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getLocalGreeting(date = new Date(), locale: SupportedLocale = 'en'): string {
  return getGreetingForHour(date.getHours(), locale);
}

export function toLocalCivilDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatCivilDate(civilDate: string, locale: SupportedLocale = 'en'): string {
  const parts = parseCivilDate(civilDate);
  if (!parts) return civilDate;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

export function formatHomeDate(date = new Date(), locale: SupportedLocale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDuration(seconds: number, t?: (key: string, options?: Record<string, unknown>) => string): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;

  if (safeSeconds === 0) return t ? t('home.units.zeroMinutes') : '0 min';
  if (safeSeconds < 60) return t ? t('home.units.lessThanMinute') : '< 1 min';

  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return t ? t('home.units.minuteShort', { count: minutes }) : `${minutes} min`;
  if (minutes === 0) return t ? t('home.units.hourShort', { count: hours }) : `${hours}h`;
  return t ? t('home.units.hourMinuteShort', { hours, minutes }) : `${hours}h ${minutes}min`;
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
