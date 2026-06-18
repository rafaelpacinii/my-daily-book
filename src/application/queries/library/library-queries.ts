import { EntityNotFoundError } from '@/src/database/errors';
import type { LibraryBook } from '@/src/database/types';
import { calculateReadingProgress, deriveCurrentPageFromLogs } from '@/src/domain/reading';

import {
  findAuthorsForWork,
  groupBy,
  readModelSnapshot,
  type ReadModelSnapshot,
} from '../read-model-store';
import { paginateItems, type PaginatedResult } from '../shared';
import type {
  LibraryBookDetails,
  LibraryBookSummary,
  LibraryOverview,
  ListLibraryBooksInput,
} from '../models';

export function getLibraryOverview(): LibraryOverview {
  const snapshot = readModelSnapshot();
  const ownedIds = new Set(snapshot.bookCopies.map((copy) => copy.libraryBookId));

  return {
    total: snapshot.libraryBooks.length,
    toRead: countByStatus(snapshot.libraryBooks, 'to_read'),
    reading: countByStatus(snapshot.libraryBooks, 'reading'),
    read: countByStatus(snapshot.libraryBooks, 'read'),
    dropped: countByStatus(snapshot.libraryBooks, 'dropped'),
    owned: ownedIds.size,
    notOwned: snapshot.libraryBooks.filter((book) => !ownedIds.has(book.id)).length,
    physicalCopies: snapshot.bookCopies.filter((copy) => copy.format === 'physical').length,
    digitalCopies: snapshot.bookCopies.filter((copy) => copy.format === 'digital').length,
  };
}

export function listLibraryBooks(
  input: ListLibraryBooksInput = {},
): PaginatedResult<LibraryBookSummary> {
  const snapshot = readModelSnapshot();
  const summaries = snapshot.libraryBooks
    .map((libraryBook) => buildLibraryBookSummary(snapshot, libraryBook))
    .filter((summary) => matchesLibraryBookFilters(summary, input))
    .sort((left, right) => compareLibrarySummaries(left, right, input));

  return paginateItems(summaries, input);
}

export function getLibraryBookDetails(libraryBookId: string): LibraryBookDetails {
  const snapshot = readModelSnapshot();
  const libraryBook = snapshot.libraryBooks.find((book) => book.id === libraryBookId);

  if (!libraryBook) {
    throw new EntityNotFoundError('LibraryBook', libraryBookId);
  }

  const summary = buildLibraryBookSummary(snapshot, libraryBook);
  const editions = snapshot.editions.filter((edition) => edition.workId === libraryBook.workId);
  const cycles = snapshot.readingCycles.filter((cycle) => cycle.libraryBookId === libraryBook.id);
  const logsByCycle = groupBy(snapshot.readingLogs, (log) => log.readingCycleId);

  return {
    ...summary,
    editions,
    cycles,
    readingLogsByCycle: cycles.map((cycle) => ({
      cycle,
      logs: logsByCycle.get(cycle.id) ?? [],
    })),
    lists: snapshot.bookListItems
      .filter((item) => item.workId === libraryBook.workId)
      .flatMap((item) => {
        const list = snapshot.bookLists.find((bookList) => bookList.id === item.bookListId);
        return list ? [{ list, item }] : [];
      }),
    goals: snapshot.readingGoalItems
      .filter((item) => item.libraryBookId === libraryBook.id)
      .flatMap((item) => {
        const goal = snapshot.readingGoals.find((readingGoal) => readingGoal.id === item.readingGoalId);
        return goal ? [{ goal, item }] : [];
      }),
  };
}

export function listCurrentlyReadingBooks(): LibraryBookSummary[] {
  return listLibraryBooks({ status: 'reading', limit: 200 }).items;
}

export function listToReadBooks(): LibraryBookSummary[] {
  return listLibraryBooks({ status: 'to_read', limit: 200 }).items;
}

export function listReadBooks(): LibraryBookSummary[] {
  return listLibraryBooks({ status: 'read', limit: 200 }).items;
}

export function listDroppedBooks(): LibraryBookSummary[] {
  return listLibraryBooks({ status: 'dropped', limit: 200 }).items;
}

function buildLibraryBookSummary(
  snapshot: ReadModelSnapshot,
  libraryBook: LibraryBook,
): LibraryBookSummary {
  const work = snapshot.works.find((item) => item.id === libraryBook.workId);

  if (!work) {
    throw new EntityNotFoundError('Work', libraryBook.workId);
  }

  const copies = snapshot.bookCopies.filter((copy) => copy.libraryBookId === libraryBook.id);
  const cycles = snapshot.readingCycles.filter((cycle) => cycle.libraryBookId === libraryBook.id);
  const activeReadingCycle = cycles.find((cycle) => cycle.status === 'reading') ?? null;
  const latestReadingCycle =
    [...cycles].sort((left, right) => right.cycleNumber - left.cycleNumber)[0] ?? null;
  const cycleForProgress = activeReadingCycle ?? latestReadingCycle;
  const cycleLogs = cycleForProgress
    ? snapshot.readingLogs.filter((log) => log.readingCycleId === cycleForProgress.id)
    : [];
  const edition = cycleForProgress
    ? snapshot.editions.find((item) => item.id === cycleForProgress.editionId)
    : copies[0]
      ? snapshot.editions.find((item) => item.id === copies[0].editionId)
      : snapshot.editions.find((item) => item.workId === libraryBook.workId);
  const currentPage = deriveCurrentPageFromLogs(cycleLogs);

  return {
    libraryBook,
    work,
    authors: findAuthorsForWork(snapshot, work.id),
    copies,
    activeReadingCycle,
    latestReadingCycle,
    currentPage,
    pageCount: edition?.pageCount ?? null,
    isbn10: edition?.isbn10 ?? null,
    isbn13: edition?.isbn13 ?? null,
    progressPercentage: calculateReadingProgress(
      currentPage,
      edition?.pageCount,
    ),
    coverUrl: edition?.coverUrl ?? edition?.thumbnailUrl ?? null,
  };
}

function matchesLibraryBookFilters(
  summary: LibraryBookSummary,
  input: ListLibraryBooksInput,
): boolean {
  if (input.status && summary.libraryBook.status !== input.status) return false;
  if (input.authorId && !summary.authors.some((author) => author.id === input.authorId)) return false;
  if (input.format && !summary.copies.some((copy) => copy.format === input.format)) return false;
  if (input.owned != null && (summary.copies.length > 0) !== input.owned) return false;

  if (!input.search) return true;

  const search = input.search.trim().toLocaleLowerCase();

  return [
    summary.work.title,
    summary.work.originalTitle,
    summary.isbn10,
    summary.isbn13,
    ...summary.authors.map((author) => author.name),
  ]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLocaleLowerCase().includes(search));
}

function compareLibrarySummaries(
  left: LibraryBookSummary,
  right: LibraryBookSummary,
  input: ListLibraryBooksInput,
): number {
  const direction = input.orderDirection === 'asc' ? 1 : -1;
  const orderBy = input.orderBy ?? 'addedAt';

  if (orderBy === 'title') {
    return direction * left.work.title.localeCompare(right.work.title);
  }

  if (orderBy === 'lastReadAt') {
    return direction * ((left.latestReadingCycle?.lastReadAt ?? '').localeCompare(right.latestReadingCycle?.lastReadAt ?? ''));
  }

  return direction * (left.libraryBook.addedAt - right.libraryBook.addedAt);
}

function countByStatus(
  books: LibraryBook[],
  status: LibraryBook['status'],
): number {
  return books.filter((book) => book.status === status).length;
}
