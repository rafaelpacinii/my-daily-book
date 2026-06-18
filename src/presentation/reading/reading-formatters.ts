import type { ReadingCycleDetails } from '@/src/application';
import { i18n } from '@/src/localization/i18n';
import { isSupportedLocale, type SupportedLocale } from '@/src/localization/locale-types';

type ReadingCycleStatus = ReadingCycleDetails['cycle']['status'];

export function toLocalCivilDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatCivilDate(value: string | null | undefined): string {
  if (!value) return t('reading.formatters.unknownDate');

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return t('reading.formatters.noDuration');

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function formatPageRange(startPage: number, endPage: number): string {
  return startPage === endPage
    ? t('reading.formatters.page', { count: startPage })
    : t('reading.formatters.pagesRange', { start: startPage, end: endPage });
}

export function formatPagesRead(pages: number): string {
  return t('reading.formatters.pagesRead', { count: pages });
}

export function formatCycleNumber(cycleNumber: number): string {
  return t('reading.formatters.cycleNumber', { count: cycleNumber });
}

export function formatReadingStatus(status: ReadingCycleStatus): string {
  switch (status) {
    case 'reading':
      return t('reading.formatters.statusReading');
    case 'completed':
      return t('reading.formatters.statusCompleted');
    case 'dropped':
      return t('reading.formatters.statusDropped');
  }
}

export function formatProgress(progressPercentage: number | null): string {
  return progressPercentage == null
    ? t('reading.formatters.progressUnavailable')
    : `${Math.round(progressPercentage)}%`;
}

export function formatCurrentPage(currentPage: number | null): string {
  return currentPage == null
    ? t('reading.formatters.noPagesLogged')
    : t('reading.formatters.page', { count: currentPage });
}

export function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;

  return parsed;
}

export function durationPartsToSeconds(hoursValue: string, minutesValue: string): number | null {
  const hours = hoursValue.trim() ? Number(hoursValue.trim()) : 0;
  const minutes = minutesValue.trim() ? Number(minutesValue.trim()) : 0;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || minutes < 0) return null;

  const totalSeconds = Math.floor(hours) * 3600 + Math.floor(minutes) * 60;

  return totalSeconds > 0 ? totalSeconds : null;
}

export function secondsToDurationParts(seconds: number | null | undefined): {
  hours: string;
  minutes: string;
} {
  if (!seconds || seconds <= 0) {
    return { hours: '', minutes: '' };
  }

  return {
    hours: `${Math.floor(seconds / 3600)}`,
    minutes: `${Math.round((seconds % 3600) / 60)}`,
  };
}

export function isValidCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}

function getLocale(): SupportedLocale {
  return isSupportedLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
}
