import { desc, eq } from 'drizzle-orm';

import { db } from '../client';
import { bookCopies } from '../schema/book-copies';
import { editions } from '../schema/editions';
import { libraryBooks, type LibraryBookStatus } from '../schema/library-books';
import { readingCycles } from '../schema/reading-cycles';
import { works } from '../schema/works';

import type {
  BookCopy,
  Edition,
  LibraryBook,
  NewLibraryBook,
  ReadingCycle,
  Work,
} from '../types';
import {
  deleteAndRead,
  firstOrNull,
  getPagination,
  insertAndRead,
  nowTimestamp,
  runDatabaseOperation,
  sanitizePersistenceRecord,
  type DatabaseExecutor,
  type PaginationInput,
  updateAndRead,
} from './shared';

export type UpdateLibraryBookInput = Partial<Omit<NewLibraryBook, 'id' | 'createdAt'>>;

export interface LibraryBookWithCopy {
  libraryBook: LibraryBook;
  work: Work;
  copy: BookCopy;
  edition: Edition;
}

export interface LibraryBookWithReadingCycle {
  libraryBook: LibraryBook;
  work: Work;
  readingCycle: ReadingCycle;
  edition: Edition;
}

export function createLibraryBook(
  input: NewLibraryBook,
  executor: DatabaseExecutor = db,
): LibraryBook {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(libraryBooks).values(sanitizePersistenceRecord(input)).run();
      },
      () => findLibraryBookById(input.id, executor),
    ),
  );
}

export function findLibraryBookById(
  id: string,
  executor: DatabaseExecutor = db,
): LibraryBook | null {
  return firstOrNull(
    executor.select().from(libraryBooks).where(eq(libraryBooks.id, id)).limit(1).all(),
  );
}

export function findLibraryBookByWorkId(
  workId: string,
  executor: DatabaseExecutor = db,
): LibraryBook | null {
  return firstOrNull(
    executor.select().from(libraryBooks).where(eq(libraryBooks.workId, workId)).limit(1).all(),
  );
}

export function listLibraryBooks(
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): LibraryBook[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(libraryBooks)
    .orderBy(desc(libraryBooks.addedAt), desc(libraryBooks.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listLibraryBooksByStatus(
  status: LibraryBookStatus,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): LibraryBook[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(libraryBooks)
    .where(eq(libraryBooks.status, status))
    .orderBy(desc(libraryBooks.addedAt), desc(libraryBooks.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function updateLibraryBook(
  id: string,
  input: UpdateLibraryBookInput,
  executor: DatabaseExecutor = db,
): LibraryBook | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(libraryBooks)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(libraryBooks.id, id))
          .run();
      },
      () => findLibraryBookById(id, executor),
    ),
  );
}

export function deleteLibraryBook(id: string, executor: DatabaseExecutor = db): LibraryBook | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findLibraryBookById(id, executor),
      () => {
        executor.delete(libraryBooks).where(eq(libraryBooks.id, id)).run();
      },
    ),
  );
}

export function findLibraryBookWithCopies(
  id: string,
  executor: DatabaseExecutor = db,
): LibraryBookWithCopy[] {
  return executor
    .select({ libraryBook: libraryBooks, work: works, copy: bookCopies, edition: editions })
    .from(libraryBooks)
    .innerJoin(works, eq(works.id, libraryBooks.workId))
    .innerJoin(bookCopies, eq(bookCopies.libraryBookId, libraryBooks.id))
    .innerJoin(editions, eq(editions.id, bookCopies.editionId))
    .where(eq(libraryBooks.id, id))
    .orderBy(desc(bookCopies.createdAt), desc(bookCopies.id))
    .all();
}

export function findLibraryBookWithReadingCycles(
  id: string,
  executor: DatabaseExecutor = db,
): LibraryBookWithReadingCycle[] {
  return executor
    .select({
      libraryBook: libraryBooks,
      work: works,
      readingCycle: readingCycles,
      edition: editions,
    })
    .from(libraryBooks)
    .innerJoin(works, eq(works.id, libraryBooks.workId))
    .innerJoin(readingCycles, eq(readingCycles.libraryBookId, libraryBooks.id))
    .innerJoin(editions, eq(editions.id, readingCycles.editionId))
    .where(eq(libraryBooks.id, id))
    .orderBy(desc(readingCycles.cycleNumber), desc(readingCycles.id))
    .all();
}
