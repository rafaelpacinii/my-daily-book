import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '../client';
import { readingLogs } from '../schema/reading-logs';
import type { NewReadingLog, ReadingLog } from '../types';
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

export type UpdateReadingLogInput = Partial<Omit<NewReadingLog, 'id' | 'createdAt'>>;

export function createReadingLogRecord(
  input: NewReadingLog,
  executor: DatabaseExecutor = db,
): ReadingLog {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(readingLogs).values(sanitizePersistenceRecord(input)).run();
      },
      () => findReadingLogById(input.id, executor),
    ),
  );
}

export function findReadingLogById(id: string, executor: DatabaseExecutor = db): ReadingLog | null {
  return firstOrNull(
    executor.select().from(readingLogs).where(eq(readingLogs.id, id)).limit(1).all(),
  );
}

export function listReadingLogsByReadingCycleId(
  readingCycleId: string,
  executor: DatabaseExecutor = db,
): ReadingLog[] {
  return executor
    .select()
    .from(readingLogs)
    .where(eq(readingLogs.readingCycleId, readingCycleId))
    .orderBy(asc(readingLogs.readingDate), asc(readingLogs.createdAt), asc(readingLogs.id))
    .all();
}

export function listReadingLogsByDate(
  readingDate: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): ReadingLog[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(readingLogs)
    .where(eq(readingLogs.readingDate, readingDate))
    .orderBy(asc(readingLogs.readingDate), asc(readingLogs.createdAt), asc(readingLogs.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listReadingLogsByDateRange(
  startDate: string,
  endDate: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): ReadingLog[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(readingLogs)
    .where(and(gte(readingLogs.readingDate, startDate), lte(readingLogs.readingDate, endDate)))
    .orderBy(asc(readingLogs.readingDate), asc(readingLogs.createdAt), asc(readingLogs.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function findLatestReadingLogByReadingCycleId(
  readingCycleId: string,
  executor: DatabaseExecutor = db,
): ReadingLog | null {
  return firstOrNull(
    executor
      .select()
      .from(readingLogs)
      .where(eq(readingLogs.readingCycleId, readingCycleId))
      .orderBy(desc(readingLogs.readingDate), desc(readingLogs.createdAt), desc(readingLogs.id))
      .limit(1)
      .all(),
  );
}

export function updateReadingLog(
  id: string,
  input: UpdateReadingLogInput,
  executor: DatabaseExecutor = db,
): ReadingLog | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(readingLogs)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(readingLogs.id, id))
          .run();
      },
      () => findReadingLogById(id, executor),
    ),
  );
}

export function deleteReadingLog(id: string, executor: DatabaseExecutor = db): ReadingLog | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findReadingLogById(id, executor),
      () => {
        executor.delete(readingLogs).where(eq(readingLogs.id, id)).run();
      },
    ),
  );
}
