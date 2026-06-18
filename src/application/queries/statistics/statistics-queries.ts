import { systemClock } from '@/src/domain/shared';
import { validateDateRange, type DateRange } from '../shared';
import { findAuthorsForWork, pagesRead, readModelSnapshot, uniqueCount } from '../read-model-store';
import type {
  AuthorReadingStatistics,
  BookReadingStatistics,
  FormatReadingStatistics,
  PeriodBucket,
  PeriodReadingStatistics,
  ReadingStatistics,
  ReadingStreak,
} from '../models';
import {
  calculateBaseReadingStatistics,
  calculateReadingStreak,
  createPeriodBuckets,
  monthKey,
  weekKey,
} from './statistics-calculations';

export function getReadingStatistics(today = systemClock.today()): ReadingStatistics {
  const snapshot = readModelSnapshot();
  return calculateBaseReadingStatistics(snapshot.readingLogs, snapshot.readingCycles, today);
}

export function getReadingStatisticsByPeriod(
  input: DateRange,
  today = systemClock.today(),
): PeriodReadingStatistics {
  validateDateRange(input);
  const snapshot = readModelSnapshot();
  const logs = snapshot.readingLogs.filter(
    (log) => log.readingDate >= input.startDate && log.readingDate <= input.endDate,
  );
  const cycles = snapshot.readingCycles.filter(
    (cycle) => cycle.startedAt <= input.endDate && (cycle.finishedAt ?? cycle.droppedAt ?? cycle.startedAt) >= input.startDate,
  );

  return {
    ...calculateBaseReadingStatistics(logs, cycles, today),
    daily: fillDailyBuckets(input.startDate, input.endDate, createPeriodBuckets(logs, (date) => date)),
    weekly: createPeriodBuckets(logs, weekKey),
    monthly: fillMonthlyBuckets(input.startDate, input.endDate, createPeriodBuckets(logs, monthKey)),
  };
}

export function getReadingStreak(today = systemClock.today()): ReadingStreak {
  return calculateReadingStreak(
    readModelSnapshot().readingLogs.map((log) => log.readingDate),
    today,
  );
}

export function getBookReadingStatistics(libraryBookId: string): BookReadingStatistics | null {
  const snapshot = readModelSnapshot();
  return getBookReadingStatisticsFromSnapshot(snapshot, libraryBookId);
}

export function listBookReadingStatistics(): BookReadingStatistics[] {
  const snapshot = readModelSnapshot();

  return snapshot.libraryBooks
    .map((book) => getBookReadingStatisticsFromSnapshot(snapshot, book.id))
    .filter((item): item is BookReadingStatistics => item != null);
}

function getBookReadingStatisticsFromSnapshot(
  snapshot: ReturnType<typeof readModelSnapshot>,
  libraryBookId: string,
): BookReadingStatistics | null {
  const libraryBook = snapshot.libraryBooks.find((book) => book.id === libraryBookId);
  if (!libraryBook) return null;

  const work = snapshot.works.find((item) => item.id === libraryBook.workId);
  if (!work) return null;

  const cycles = snapshot.readingCycles.filter((cycle) => cycle.libraryBookId === libraryBook.id);
  const cycleIds = new Set(cycles.map((cycle) => cycle.id));
  const logs = snapshot.readingLogs.filter((log) => cycleIds.has(log.readingCycleId));
  const readingDays = uniqueCount(logs.map((log) => log.readingDate));
  const totalPagesRead = logs.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0);
  const totalDurationSeconds = logs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0);

  return {
    libraryBook,
    work,
    authors: findAuthorsForWork(snapshot, work.id),
    totalCycles: cycles.length,
    completedCycles: cycles.filter((cycle) => cycle.status === 'completed').length,
    droppedCycles: cycles.filter((cycle) => cycle.status === 'dropped').length,
    rereadCount: cycles.filter((cycle) => cycle.cycleNumber > 1).length,
    totalPagesRead,
    totalDurationSeconds,
    readingDays,
    firstStartedAt: cycles[0]?.startedAt ?? null,
    latestFinishedAt: [...cycles].reverse().find((cycle) => cycle.finishedAt)?.finishedAt ?? null,
    averagePagesPerDay: readingDays === 0 ? 0 : totalPagesRead / readingDays,
    averageDurationPerDay: readingDays === 0 ? 0 : totalDurationSeconds / readingDays,
  };
}

export function getAuthorReadingStatistics(): AuthorReadingStatistics[] {
  const snapshot = readModelSnapshot();

  return snapshot.authors.map((author) => {
    const workIds = snapshot.workAuthors
      .filter((row) => row.authorId === author.id)
      .map((row) => row.workId);
    const libraryBookIds = snapshot.libraryBooks
      .filter((book) => workIds.includes(book.workId))
      .map((book) => book.id);
    const cycles = snapshot.readingCycles.filter((cycle) => libraryBookIds.includes(cycle.libraryBookId));
    const cycleIds = new Set(cycles.map((cycle) => cycle.id));
    const logs = snapshot.readingLogs.filter((log) => cycleIds.has(log.readingCycleId));
    const ratings = cycles
      .map((cycle) => cycle.rating)
      .filter((rating): rating is number => typeof rating === 'number');

    return {
      author,
      worksRead: uniqueCount(cycles.filter((cycle) => cycle.status === 'completed').map((cycle) => cycle.libraryBookId)),
      completedCycles: cycles.filter((cycle) => cycle.status === 'completed').length,
      pagesRead: logs.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0),
      durationSeconds: logs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0),
      averageRating: ratings.length === 0 ? null : ratings.reduce((total, rating) => total + rating, 0) / ratings.length,
      rereads: cycles.filter((cycle) => cycle.cycleNumber > 1).length,
    };
  });
}

export function getFormatReadingStatistics(): FormatReadingStatistics[] {
  const snapshot = readModelSnapshot();
  const formats: FormatReadingStatistics[] = [
    { format: 'physical', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
    { format: 'digital', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
    { format: 'unknown', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
  ];

  snapshot.readingCycles.forEach((cycle) => {
    const copy = cycle.bookCopyId
      ? snapshot.bookCopies.find((item) => item.id === cycle.bookCopyId)
      : null;
    const bucket = formats.find((item) => item.format === (copy?.format ?? 'unknown'));
    const logs = snapshot.readingLogs.filter((log) => log.readingCycleId === cycle.id);

    if (bucket) {
      bucket.completedCycles += cycle.status === 'completed' ? 1 : 0;
      bucket.pagesRead += logs.reduce((total, log) => total + pagesRead(log.startPage, log.endPage), 0);
      bucket.durationSeconds += logs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0);
    }
  });

  return formats;
}

function fillDailyBuckets(startDate: string, endDate: string, buckets: PeriodBucket[]): PeriodBucket[] {
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const result: PeriodBucket[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    result.push(byKey.get(cursor) ?? emptyBucket(cursor));
    cursor = nextDate(cursor);
  }

  return result;
}

function fillMonthlyBuckets(startDate: string, endDate: string, buckets: PeriodBucket[]): PeriodBucket[] {
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const result: PeriodBucket[] = [];
  let cursor = monthKey(startDate);
  const endMonth = monthKey(endDate);

  while (cursor <= endMonth) {
    result.push(byKey.get(cursor) ?? emptyBucket(cursor));
    cursor = nextMonth(cursor);
  }

  return result;
}

function emptyBucket(key: string): PeriodBucket {
  return { key, pagesRead: 0, durationSeconds: 0, logCount: 0 };
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  parsed.setUTCDate(parsed.getUTCDate() + 1);

  return parsed.toISOString().slice(0, 10);
}

function nextMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, monthNumber - 1, 1));
  parsed.setUTCMonth(parsed.getUTCMonth() + 1);

  return parsed.toISOString().slice(0, 7);
}
