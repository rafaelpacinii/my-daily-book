import type { ReadingCycle, ReadingLog } from '@/src/database/types';

import type { PeriodBucket, ReadingStatistics, ReadingStreak } from '../models';

export function calculateReadingStreak(readingDates: string[], today: string): ReadingStreak {
  const dates = [...new Set(readingDates)].sort();
  const latestReadingDate = dates.at(-1) ?? null;
  const longestStreak = calculateLongestStreak(dates);
  const currentStreak = calculateCurrentStreak(dates, today);

  return { currentStreak, longestStreak, latestReadingDate };
}

export function calculateBaseReadingStatistics(
  logs: ReadingLog[],
  cycles: ReadingCycle[],
  today: string,
): ReadingStatistics {
  const dailyBuckets = groupLogsByKey(logs, (log) => log.readingDate);
  const pagesByDay = [...dailyBuckets.values()].map((items) =>
    items.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0),
  );
  const timeByDay = [...dailyBuckets.values()].map((items) =>
    items.reduce((total, log) => total + (log.durationSeconds ?? 0), 0),
  );
  const streak = calculateReadingStreak(logs.map((log) => log.readingDate), today);
  const completedCycles = cycles.filter((cycle) => cycle.status === 'completed');

  return {
    totalPagesRead: logs.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0),
    totalDurationSeconds: logs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0),
    totalLogs: logs.length,
    totalReadingDays: dailyBuckets.size,
    totalCompletedCycles: completedCycles.length,
    totalRereads: cycles.filter((cycle) => cycle.cycleNumber > 1 && cycle.status === 'completed').length,
    totalCompletedWorks: uniqueCount(completedCycles.map((cycle) => cycle.libraryBookId)),
    averagePagesPerReadingDay: average(pagesByDay),
    averagePagesPerLog: logs.length === 0 ? 0 : logs.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0) / logs.length,
    averageDurationPerReadingDay: average(timeByDay),
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    mostPagesInOneDay: Math.max(0, ...pagesByDay),
    mostTimeInOneDay: Math.max(0, ...timeByDay),
  };
}

export function createPeriodBuckets(
  logs: ReadingLog[],
  key: (date: string) => string,
): PeriodBucket[] {
  return [...groupLogsByKey(logs, (log) => key(log.readingDate)).entries()]
    .map(([bucketKey, bucketLogs]) => ({
      key: bucketKey,
      pagesRead: bucketLogs.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0),
      durationSeconds: bucketLogs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0),
      logCount: bucketLogs.length,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function weekKey(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const day = parsed.getUTCDay() || 7;
  parsed.setUTCDate(parsed.getUTCDate() - day + 1);

  return parsed.toISOString().slice(0, 10);
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

function groupLogsByKey(
  logs: ReadingLog[],
  key: (log: ReadingLog) => string,
): Map<string, ReadingLog[]> {
  const map = new Map<string, ReadingLog[]>();

  logs.forEach((log) => {
    const value = key(log);
    map.set(value, [...(map.get(value) ?? []), log]);
  });

  return map;
}

function calculateCurrentStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0;

  const dateSet = new Set(dates);
  let cursor = dateSet.has(today) ? today : previousDate(today);

  if (!dateSet.has(cursor)) return 0;

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = previousDate(cursor);
  }

  return streak;
}

function calculateLongestStreak(dates: string[]): number {
  let longest = 0;
  let current = 0;
  let previous: string | null = null;

  dates.forEach((date) => {
    current = previous && previousDate(date) === previous ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  });

  return longest;
}

function previousDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - 1);

  return parsed.toISOString().slice(0, 10);
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function pagesRead(startPage: number, endPage: number): number {
  return endPage - startPage + 1;
}

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}
