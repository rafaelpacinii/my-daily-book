import { EntityNotFoundError } from '@/src/database/errors';
import type { ReadingCycle, ReadingLog } from '@/src/database/types';
import {
  calculateReadingProgress,
  calculateTotalDuration,
  calculateTotalPagesRead,
  deriveCurrentPageFromLogs,
} from '@/src/domain/reading';
import { validateDateRange } from '../shared';
import { findAuthorsForWork, pagesRead, readModelSnapshot } from '../read-model-store';
import { paginateItems, type DateRange, type PaginatedResult, type PaginationInput } from '../shared';
import type {
  DailyReadingSummary,
  ListReadingHistoryInput,
  ReadingCycleDetails,
  ReadingHistoryItem,
  ReadingLogSummary,
} from '../models';

export function getActiveReadingCycle(libraryBookId: string): ReadingCycleDetails | null {
  const snapshot = readModelSnapshot();
  const cycle = snapshot.readingCycles.find(
    (item) => item.libraryBookId === libraryBookId && item.status === 'reading',
  );

  return cycle ? buildReadingCycleDetails(snapshot, cycle) : null;
}

export function listActiveReadingCycles(): ReadingCycleDetails[] {
  const snapshot = readModelSnapshot();

  return snapshot.readingCycles
    .filter((cycle) => cycle.status === 'reading')
    .map((cycle) => buildReadingCycleDetails(snapshot, cycle))
    .sort(compareActiveCycleDetails);
}

export function getReadingCycleDetails(readingCycleId: string): ReadingCycleDetails {
  const snapshot = readModelSnapshot();
  const cycle = snapshot.readingCycles.find((item) => item.id === readingCycleId);

  if (!cycle) {
    throw new EntityNotFoundError('ReadingCycle', readingCycleId);
  }

  return buildReadingCycleDetails(snapshot, cycle);
}

export function getReadingLogDetails(readingLogId: string): ReadingLogSummary {
  const snapshot = readModelSnapshot();
  const log = snapshot.readingLogs.find((item) => item.id === readingLogId);

  if (!log) {
    throw new EntityNotFoundError('ReadingLog', readingLogId);
  }

  return buildReadingLogSummary(snapshot, log);
}

export function listReadingHistory(
  input: ListReadingHistoryInput = {},
): PaginatedResult<ReadingHistoryItem> {
  const snapshot = readModelSnapshot();
  const items = snapshot.readingCycles
    .filter((cycle) => matchesHistoryFilter(cycle, input))
    .map((cycle) => {
      const details = buildReadingCycleDetails(snapshot, cycle);

      return {
        cycle,
        libraryBook: details.libraryBook,
        work: details.work,
        authors: details.authors,
        edition: details.edition,
        totalPagesRead: details.totalPagesRead,
        totalDurationSeconds: details.totalDurationSeconds,
      };
    })
    .sort((left, right) => compareHistory(left, right, input));

  return paginateItems(items, input);
}

export function listReadingLogsByDate(
  readingDate: string,
  pagination?: PaginationInput,
): PaginatedResult<ReadingLogSummary> {
  const snapshot = readModelSnapshot();
  const items = snapshot.readingLogs
    .filter((log) => log.readingDate === readingDate)
    .map((log) => buildReadingLogSummary(snapshot, log));

  return paginateItems(items, pagination);
}

export function listReadingLogsByDateRange(
  input: DateRange & PaginationInput,
): PaginatedResult<ReadingLogSummary> {
  validateDateRange(input);
  const snapshot = readModelSnapshot();
  const items = snapshot.readingLogs
    .filter((log) => log.readingDate >= input.startDate && log.readingDate <= input.endDate)
    .map((log) => buildReadingLogSummary(snapshot, log));

  return paginateItems(items, input);
}

export function getDailyReadingSummary(readingDate: string): DailyReadingSummary {
  const logs = listReadingLogsByDate(readingDate, { limit: 200 }).items;

  return {
    readingDate,
    pagesRead: logs.reduce((total, item) => total + item.pagesRead, 0),
    durationSeconds: logs.reduce((total, item) => total + (item.log.durationSeconds ?? 0), 0),
    logCount: logs.length,
    booksRead: new Set(logs.map((item) => item.libraryBook.id)).size,
    logs,
  };
}

function buildReadingCycleDetails(
  snapshot: ReturnType<typeof readModelSnapshot>,
  cycle: ReadingCycle,
): ReadingCycleDetails {
  const libraryBook = snapshot.libraryBooks.find((item) => item.id === cycle.libraryBookId);
  const edition = snapshot.editions.find((item) => item.id === cycle.editionId);

  if (!libraryBook) throw new EntityNotFoundError('LibraryBook', cycle.libraryBookId);
  if (!edition) throw new EntityNotFoundError('Edition', cycle.editionId);

  const work = snapshot.works.find((item) => item.id === libraryBook.workId);
  if (!work) throw new EntityNotFoundError('Work', libraryBook.workId);

  const logs = snapshot.readingLogs.filter((log) => log.readingCycleId === cycle.id);

  return {
    cycle,
    libraryBook,
    work,
    authors: findAuthorsForWork(snapshot, work.id),
    edition,
    copy: cycle.bookCopyId
      ? snapshot.bookCopies.find((copy) => copy.id === cycle.bookCopyId) ?? null
      : null,
    logs,
    progressPercentage: calculateReadingProgress(deriveCurrentPageFromLogs(logs), edition.pageCount),
    totalPagesRead: calculateTotalPagesRead(logs),
    totalDurationSeconds: calculateTotalDuration(logs),
  };
}

function buildReadingLogSummary(
  snapshot: ReturnType<typeof readModelSnapshot>,
  log: ReadingLog,
): ReadingLogSummary {
  const cycle = snapshot.readingCycles.find((item) => item.id === log.readingCycleId);
  if (!cycle) throw new EntityNotFoundError('ReadingCycle', log.readingCycleId);

  const details = buildReadingCycleDetails(snapshot, cycle);

  return {
    log,
    cycle,
    libraryBook: details.libraryBook,
    work: details.work,
    authors: details.authors,
    pagesRead: pagesRead(log.startPage, log.endPage),
  };
}

function matchesHistoryFilter(cycle: ReadingCycle, input: ListReadingHistoryInput): boolean {
  if (input.libraryBookId && cycle.libraryBookId !== input.libraryBookId) return false;
  if (input.status && cycle.status !== input.status) return false;
  if (input.startDate && cycle.startedAt < input.startDate) return false;
  if (input.endDate && cycle.startedAt > input.endDate) return false;
  return true;
}

function compareHistory(
  left: ReadingHistoryItem,
  right: ReadingHistoryItem,
  input: ListReadingHistoryInput,
): number {
  const direction = input.orderDirection === 'asc' ? 1 : -1;
  const field = input.orderBy ?? 'startedAt';
  const leftValue = field === 'finishedAt'
    ? left.cycle.finishedAt ?? ''
    : field === 'lastReadAt'
      ? left.cycle.lastReadAt ?? ''
      : left.cycle.startedAt;
  const rightValue = field === 'finishedAt'
    ? right.cycle.finishedAt ?? ''
    : field === 'lastReadAt'
      ? right.cycle.lastReadAt ?? ''
      : right.cycle.startedAt;

  return direction * leftValue.localeCompare(rightValue);
}

function compareActiveCycleDetails(left: ReadingCycleDetails, right: ReadingCycleDetails): number {
  const leftValue = left.cycle.lastReadAt ?? left.cycle.startedAt;
  const rightValue = right.cycle.lastReadAt ?? right.cycle.startedAt;
  const dateComparison = rightValue.localeCompare(leftValue);

  if (dateComparison !== 0) return dateComparison;

  return left.work.title.localeCompare(right.work.title);
}
