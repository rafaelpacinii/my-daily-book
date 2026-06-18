import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '../client';
import { readingCycles } from '../schema/reading-cycles';
import type { NewReadingCycle, ReadingCycle } from '../types';
import type { ReadingCycleStatus } from '../schema/reading-cycles';
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

export type UpdateReadingCycleInput = Partial<Omit<NewReadingCycle, 'id' | 'createdAt'>>;

export function createReadingCycleRecord(
  input: NewReadingCycle,
  executor: DatabaseExecutor = db,
): ReadingCycle {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(readingCycles).values(sanitizePersistenceRecord(input)).run();
      },
      () => findReadingCycleById(input.id, executor),
    ),
  );
}

export function findReadingCycleById(
  id: string,
  executor: DatabaseExecutor = db,
): ReadingCycle | null {
  return firstOrNull(
    executor.select().from(readingCycles).where(eq(readingCycles.id, id)).limit(1).all(),
  );
}

export function listReadingCyclesByLibraryBookId(
  libraryBookId: string,
  executor: DatabaseExecutor = db,
): ReadingCycle[] {
  return executor
    .select()
    .from(readingCycles)
    .where(eq(readingCycles.libraryBookId, libraryBookId))
    .orderBy(asc(readingCycles.cycleNumber), asc(readingCycles.id))
    .all();
}

export function listReadingCyclesByEditionId(
  editionId: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): ReadingCycle[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(readingCycles)
    .where(eq(readingCycles.editionId, editionId))
    .orderBy(asc(readingCycles.startedAt), asc(readingCycles.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listReadingCyclesByStatus(
  status: ReadingCycleStatus,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): ReadingCycle[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(readingCycles)
    .where(eq(readingCycles.status, status))
    .orderBy(asc(readingCycles.startedAt), asc(readingCycles.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function findActiveReadingCycleByLibraryBookId(
  libraryBookId: string,
  executor: DatabaseExecutor = db,
): ReadingCycle | null {
  return firstOrNull(
    executor
      .select()
      .from(readingCycles)
      .where(
        and(eq(readingCycles.libraryBookId, libraryBookId), eq(readingCycles.status, 'reading')),
      )
      .orderBy(desc(readingCycles.cycleNumber), desc(readingCycles.id))
      .limit(1)
      .all(),
  );
}

export function findLatestReadingCycleByLibraryBookId(
  libraryBookId: string,
  executor: DatabaseExecutor = db,
): ReadingCycle | null {
  return firstOrNull(
    executor
      .select()
      .from(readingCycles)
      .where(eq(readingCycles.libraryBookId, libraryBookId))
      .orderBy(desc(readingCycles.cycleNumber), desc(readingCycles.id))
      .limit(1)
      .all(),
  );
}

export function updateReadingCycle(
  id: string,
  input: UpdateReadingCycleInput,
  executor: DatabaseExecutor = db,
): ReadingCycle | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(readingCycles)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(readingCycles.id, id))
          .run();
      },
      () => findReadingCycleById(id, executor),
    ),
  );
}

export function deleteReadingCycle(
  id: string,
  executor: DatabaseExecutor = db,
): ReadingCycle | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findReadingCycleById(id, executor),
      () => {
        executor.delete(readingCycles).where(eq(readingCycles.id, id)).run();
      },
    ),
  );
}
