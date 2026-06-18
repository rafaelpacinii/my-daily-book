import { and, asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { editions } from '../schema/editions';
import type { Edition, NewEdition } from '../types';
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

export type UpdateEditionInput = Partial<Omit<NewEdition, 'id' | 'createdAt'>>;

export function createEdition(input: NewEdition, executor: DatabaseExecutor = db): Edition {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(editions).values(sanitizePersistenceRecord(input)).run();
      },
      () => findEditionById(input.id, executor),
    ),
  );
}

export function findEditionById(id: string, executor: DatabaseExecutor = db): Edition | null {
  return firstOrNull(executor.select().from(editions).where(eq(editions.id, id)).limit(1).all());
}

export function findEditionByGoogleBooksId(
  googleBooksId: string,
  executor: DatabaseExecutor = db,
): Edition | null {
  return firstOrNull(
    executor.select().from(editions).where(eq(editions.googleBooksId, googleBooksId)).limit(1).all(),
  );
}

export function findEditionByExternalMetadataId(
  metadataSource: string,
  externalMetadataId: string,
  executor: DatabaseExecutor = db,
): Edition | null {
  return firstOrNull(
    executor
      .select()
      .from(editions)
      .where(and(
        eq(editions.metadataSource, metadataSource),
        eq(editions.externalMetadataId, externalMetadataId),
      ))
      .limit(1)
      .all(),
  );
}

export function findEditionsByIsbn10(
  isbn10: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): Edition[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(editions)
    .where(eq(editions.isbn10, isbn10))
    .orderBy(asc(editions.publishedDate), asc(editions.title), asc(editions.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function findEditionsByIsbn13(
  isbn13: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): Edition[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(editions)
    .where(eq(editions.isbn13, isbn13))
    .orderBy(asc(editions.publishedDate), asc(editions.title), asc(editions.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listEditionsByWorkId(
  workId: string,
  executor: DatabaseExecutor = db,
): Edition[] {
  return executor
    .select()
    .from(editions)
    .where(eq(editions.workId, workId))
    .orderBy(asc(editions.publishedDate), asc(editions.title), asc(editions.id))
    .all();
}

export function updateEdition(
  id: string,
  input: UpdateEditionInput,
  executor: DatabaseExecutor = db,
): Edition | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(editions)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(editions.id, id))
          .run();
      },
      () => findEditionById(id, executor),
    ),
  );
}

export function deleteEdition(id: string, executor: DatabaseExecutor = db): Edition | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findEditionById(id, executor),
      () => {
        executor.delete(editions).where(eq(editions.id, id)).run();
      },
    ),
  );
}
