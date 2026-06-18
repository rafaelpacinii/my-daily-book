import { validatePageRange } from './validate-page-range';
import type { ReadingLogStatsInput, ReadingPageRange } from '../types';

export function calculatePagesRead(startPage: number, endPage: number): number {
  validatePageRange(startPage, endPage);

  return endPage - startPage + 1;
}

export function calculateTotalPagesRead(logs: ReadingPageRange[]): number {
  return logs.reduce((total, log) => total + calculatePagesRead(log.startPage, log.endPage), 0);
}

export function calculateTotalDuration(logs: ReadingLogStatsInput[]): number {
  return logs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0);
}

export function countReadingDays(logs: ReadingLogStatsInput[]): number {
  return new Set(logs.map((log) => log.readingDate)).size;
}

export function calculateAveragePagesPerReadingDay(logs: ReadingLogStatsInput[]): number | null {
  const days = countReadingDays(logs);

  if (days === 0) {
    return null;
  }

  return calculateTotalPagesRead(logs) / days;
}

export function calculateAveragePagesPerLog(logs: ReadingLogStatsInput[]): number | null {
  if (logs.length === 0) {
    return null;
  }

  return calculateTotalPagesRead(logs) / logs.length;
}

