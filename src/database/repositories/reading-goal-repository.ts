import { asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { libraryBooks } from '../schema/library-books';
import { readingGoalItems, readingGoals } from '../schema/reading-goals';
import { works } from '../schema/works';

import type {
  LibraryBook,
  NewReadingGoal,
  NewReadingGoalItem,
  ReadingGoal,
  ReadingGoalItem,
  Work,
} from '../types';
import type { ReadingGoalStatus } from '../schema/reading-goals';
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

export type UpdateReadingGoalInput = Partial<Omit<NewReadingGoal, 'id' | 'createdAt'>>;
export type UpdateReadingGoalItemInput = Partial<Omit<NewReadingGoalItem, 'id' | 'createdAt'>>;

export interface ReadingGoalItemWithBook {
  item: ReadingGoalItem;
  libraryBook: LibraryBook;
  work: Work;
}

export interface ReadingGoalWithItems {
  readingGoal: ReadingGoal;
  items: ReadingGoalItemWithBook[];
}

export function createReadingGoalRecord(
  input: NewReadingGoal,
  executor: DatabaseExecutor = db,
): ReadingGoal {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(readingGoals).values(sanitizePersistenceRecord(input)).run();
      },
      () => findReadingGoalById(input.id, executor),
    ),
  );
}

export function findReadingGoalById(
  id: string,
  executor: DatabaseExecutor = db,
): ReadingGoal | null {
  return firstOrNull(
    executor.select().from(readingGoals).where(eq(readingGoals.id, id)).limit(1).all(),
  );
}

export function listReadingGoals(
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): ReadingGoal[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(readingGoals)
    .orderBy(asc(readingGoals.targetDate), asc(readingGoals.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listReadingGoalsByStatus(
  status: ReadingGoalStatus,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): ReadingGoal[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(readingGoals)
    .where(eq(readingGoals.status, status))
    .orderBy(asc(readingGoals.targetDate), asc(readingGoals.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function updateReadingGoal(
  id: string,
  input: UpdateReadingGoalInput,
  executor: DatabaseExecutor = db,
): ReadingGoal | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(readingGoals)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(readingGoals.id, id))
          .run();
      },
      () => findReadingGoalById(id, executor),
    ),
  );
}

export function deleteReadingGoal(id: string, executor: DatabaseExecutor = db): ReadingGoal | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findReadingGoalById(id, executor),
      () => {
        executor.delete(readingGoals).where(eq(readingGoals.id, id)).run();
      },
    ),
  );
}

export function createReadingGoalItem(
  input: NewReadingGoalItem,
  executor: DatabaseExecutor = db,
): ReadingGoalItem {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(readingGoalItems).values(sanitizePersistenceRecord(input)).run();
      },
      () => findReadingGoalItemById(input.id, executor),
    ),
  );
}

export function findReadingGoalItemById(
  id: string,
  executor: DatabaseExecutor = db,
): ReadingGoalItem | null {
  return firstOrNull(
    executor.select().from(readingGoalItems).where(eq(readingGoalItems.id, id)).limit(1).all(),
  );
}

export function listReadingGoalItems(
  readingGoalId: string,
  executor: DatabaseExecutor = db,
): ReadingGoalItem[] {
  return executor
    .select()
    .from(readingGoalItems)
    .where(eq(readingGoalItems.readingGoalId, readingGoalId))
    .orderBy(
      asc(readingGoalItems.position),
      asc(readingGoalItems.addedAt),
      asc(readingGoalItems.id),
    )
    .all();
}

export function updateReadingGoalItem(
  id: string,
  input: UpdateReadingGoalItemInput,
  executor: DatabaseExecutor = db,
): ReadingGoalItem | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(readingGoalItems)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(readingGoalItems.id, id))
          .run();
      },
      () => findReadingGoalItemById(id, executor),
    ),
  );
}

export function deleteReadingGoalItem(
  id: string,
  executor: DatabaseExecutor = db,
): ReadingGoalItem | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findReadingGoalItemById(id, executor),
      () => {
        executor.delete(readingGoalItems).where(eq(readingGoalItems.id, id)).run();
      },
    ),
  );
}

export function findReadingGoalWithItems(
  id: string,
  executor: DatabaseExecutor = db,
): ReadingGoalWithItems | null {
  const readingGoal = findReadingGoalById(id, executor);

  if (!readingGoal) {
    return null;
  }

  const items = executor
    .select({ item: readingGoalItems, libraryBook: libraryBooks, work: works })
    .from(readingGoalItems)
    .innerJoin(libraryBooks, eq(libraryBooks.id, readingGoalItems.libraryBookId))
    .innerJoin(works, eq(works.id, libraryBooks.workId))
    .where(eq(readingGoalItems.readingGoalId, id))
    .orderBy(
      asc(readingGoalItems.position),
      asc(readingGoalItems.addedAt),
      asc(readingGoalItems.id),
    )
    .all();

  return { readingGoal, items };
}
