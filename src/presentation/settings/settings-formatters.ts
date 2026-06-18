import { i18n } from '@/src/localization/i18n';
import { isSupportedLocale } from '@/src/localization/locale-types';

export function formatTimestamp(value: number | null | undefined): string {
  if (!value) return t('settings.backup.unknownDate');
  return createDateTimeFormatter().format(new Date(value));
}

export function formatIsoTimestamp(value: string | null | undefined): string {
  if (!value) return t('settings.backup.unknownDate');
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? createDateTimeFormatter().format(new Date(parsed)) : value;
}

export function formatFileSize(size: number | null | undefined): string {
  if (size == null || !Number.isFinite(size)) return t('settings.backup.unknownSize');
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${formatDecimal(size / 1024)} KB`;
  return `${formatDecimal(size / (1024 * 1024))} MB`;
}

export interface BackupCountsLike {
  authors: number;
  works: number;
  workAuthors: number;
  editions: number;
  libraryBooks: number;
  bookCopies: number;
  readingCycles: number;
  readingLogs: number;
  bookLists: number;
  bookListItems: number;
  purchaseLinks: number;
  readingGoals: number;
  readingGoalItems: number;
}

export function formatBackupCounts(counts: BackupCountsLike): string {
  return t('settings.backup.counts', {
    books: t('settings.backup.books', { count: counts.libraryBooks }),
    cycles: t('settings.backup.cycles', { count: counts.readingCycles }),
    logs: t('settings.backup.logs', { count: counts.readingLogs }),
    lists: t('settings.backup.lists', { count: counts.bookLists }),
    goals: t('settings.backup.goals', { count: counts.readingGoals }),
  });
}

export function formatOptionalVersion(value: number | null | undefined): string {
  return value == null ? t('settings.backup.unknown') : String(value);
}

function createDateTimeFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat(getActiveLocale(), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function getActiveLocale() {
  return isSupportedLocale(i18n.language) ? i18n.language : 'en';
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
