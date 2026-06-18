import { i18n } from '@/src/localization/i18n';

export function formatCivilDate(value: string | null): string {
  if (!value) return t('goals.formatters.notSet');

  const parsed = parseCivilDate(value);
  if (!parsed) return value;

  return new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function parseCivilDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;

  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) return null;

  return new Date(year, month - 1, day);
}

export function isValidCivilDate(value: string): boolean {
  return parseCivilDate(value) != null;
}

export function getTodayCivilDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function compareCivilDates(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function formatDueLabel(daysRemaining: number | null, isOverdue: boolean): string {
  if (daysRemaining == null) return t('goals.formatters.deadlineUnavailable');
  if (daysRemaining === 0) return t('goals.formatters.dueToday');

  const absoluteDays = Math.abs(daysRemaining);

  if (isOverdue || daysRemaining < 0) {
    return t('goals.formatters.overdueBy', { count: absoluteDays });
  }

  return t('goals.formatters.dueIn', { count: daysRemaining });
}

export function formatGoalStatus(status: 'active' | 'completed' | 'cancelled'): string {
  if (status === 'active') return t('goals.formatters.active');
  if (status === 'completed') return t('goals.formatters.completed');
  return t('goals.formatters.cancelled');
}

export function formatCompletionTiming(
  status: 'active' | 'completed' | 'cancelled',
  isCompletedWithinDeadline: boolean,
): string {
  if (status === 'cancelled') return t('goals.formatters.cancelled');
  if (status !== 'completed') return t('goals.formatters.inProgress');
  return isCompletedWithinDeadline
    ? t('goals.formatters.completedOnTime')
    : t('goals.formatters.completedAfterDeadline');
}

export function formatBooksProgress(completed: number, total: number): string {
  return t('goals.formatters.booksProgress', { completed, total, count: total });
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
