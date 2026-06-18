import type { ReadingLogStatsInput } from '../types';

export function calculateReadingProgress(
  currentPage: number | null,
  pageCount?: number | null,
): number | null {
  if (currentPage == null || pageCount == null || pageCount < 1) {
    return null;
  }

  const percentage = (currentPage / pageCount) * 100;

  return Math.max(0, Math.min(100, percentage));
}

export function deriveCurrentPageFromLogs(logs: ReadingLogStatsInput[]): number | null {
  if (logs.length === 0) {
    return null;
  }

  return logs.reduce((highestPage, log) => Math.max(highestPage, log.endPage), 0);
}

