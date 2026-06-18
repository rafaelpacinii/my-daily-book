import { desc, eq } from 'drizzle-orm';

import { db } from '../client';
import { bookCopies, type BookCopyFormat } from '../schema/book-copies';
import type { BookCopy, NewBookCopy } from '../types';
import {
  deleteAndRead,
  firstOrNull,
  getPagination,
  insertAndRead,
  nowTimestamp,
  sanitizePersistenceRecord,
  type DatabaseExecutor,
  type PaginationInput,
  runDatabaseOperation,
  updateAndRead,
} from './shared';

export type UpdateBookCopyInput = Partial<Omit<NewBookCopy, 'id' | 'createdAt'>>;

export function createBookCopy(input: NewBookCopy, executor: DatabaseExecutor = db): BookCopy {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(bookCopies).values(sanitizePersistenceRecord(input)).run();
      },
      () => findBookCopyById(input.id, executor),
    ),
  );
}

export function findBookCopyById(id: string, executor: DatabaseExecutor = db): BookCopy | null {
  return firstOrNull(executor.select().from(bookCopies).where(eq(bookCopies.id, id)).limit(1).all());
}

export function listBookCopiesByLibraryBookId(
  libraryBookId: string,
  executor: DatabaseExecutor = db,
): BookCopy[] {
  return executor
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.libraryBookId, libraryBookId))
    .orderBy(desc(bookCopies.createdAt), desc(bookCopies.id))
    .all();
}

export function listBookCopiesByEditionId(
  editionId: string,
  executor: DatabaseExecutor = db,
): BookCopy[] {
  return executor
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.editionId, editionId))
    .orderBy(desc(bookCopies.createdAt), desc(bookCopies.id))
    .all();
}

export function listBookCopiesByFormat(
  format: BookCopyFormat,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): BookCopy[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.format, format))
    .orderBy(desc(bookCopies.createdAt), desc(bookCopies.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function updateBookCopy(
  id: string,
  input: UpdateBookCopyInput,
  executor: DatabaseExecutor = db,
): BookCopy | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(bookCopies)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(bookCopies.id, id))
          .run();
      },
      () => findBookCopyById(id, executor),
    ),
  );
}

export function deleteBookCopy(id: string, executor: DatabaseExecutor = db): BookCopy | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findBookCopyById(id, executor),
      () => {
        executor.delete(bookCopies).where(eq(bookCopies.id, id)).run();
      },
    ),
  );
}
