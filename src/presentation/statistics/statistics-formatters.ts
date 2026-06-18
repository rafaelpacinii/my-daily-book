import { i18n } from '@/src/localization/i18n';
import { isSupportedLocale, type SupportedLocale } from '@/src/localization/locale-types';

export function formatInteger(value: number): string {
  return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(safeNumber(value));
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(safeNumber(value));
}

export function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(safeNumber(value))}%`;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, safeNumber(seconds));
  if (safeSeconds === 0) return t('statistics.formatters.zeroMinutes');

  const totalMinutes = Math.round(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return t('statistics.formatters.minuteShort', { count: totalMinutes });
  if (minutes === 0) return t('statistics.formatters.hourShort', { count: hours });
  return t('statistics.formatters.hourMinuteShort', { hours, minutes });
}

export function formatCivilDate(value: string): string {
  const parsed = parseCivilDate(value);
  if (!parsed) return value;

  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function formatMonthLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;

  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    year: 'numeric',
  }).format(new Date(Number(match[1]), Number(match[2]) - 1, 1));
}

export function formatAuthors(authors: string[]): string {
  return authors.length > 0 ? authors.join(', ') : t('statistics.formatters.unknownAuthor');
}

export function pluralize(value: number, singular: string, plural = `${singular}s`): string {
  return `${formatInteger(value)} ${value === 1 ? singular : plural}`;
}

export function toLocalCivilDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isValidCivilDate(value: string): boolean {
  return parseCivilDate(value) != null;
}

export function compareCivilDates(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function addCivilDays(value: string, days: number): string {
  const parsed = parseCivilDate(value);
  if (!parsed) return value;

  parsed.setDate(parsed.getDate() + days);
  return toLocalCivilDate(parsed);
}

export function startOfMonth(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

export function startOfYear(value: string): string {
  return `${value.slice(0, 4)}-01-01`;
}

function parseCivilDate(value: string): Date | null {
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

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}

function getLocale(): SupportedLocale {
  return isSupportedLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
}
