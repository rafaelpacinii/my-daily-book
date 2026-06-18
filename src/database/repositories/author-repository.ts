import { asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { authors } from '../schema/authors';
import type { Author, NewAuthor } from '../types';
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

export type UpdateAuthorInput = Partial<Omit<NewAuthor, 'id' | 'createdAt'>>;

export function createAuthor(input: NewAuthor, executor: DatabaseExecutor = db): Author {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(authors).values(sanitizePersistenceRecord(input)).run();
      },
      () => findAuthorById(input.id, executor),
    ),
  );
}

export function findAuthorById(id: string, executor: DatabaseExecutor = db): Author | null {
  return firstOrNull(executor.select().from(authors).where(eq(authors.id, id)).limit(1).all());
}

export function findAuthorsByName(
  name: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): Author[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(authors)
    .where(eq(authors.name, name))
    .orderBy(asc(authors.name), asc(authors.id))
    .limit(limit)
    .offset(offset).all();
}

export function listAuthors(
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): Author[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(authors)
    .orderBy(asc(authors.name), asc(authors.id))
    .limit(limit)
    .offset(offset).all();
}

export function updateAuthor(
  id: string,
  input: UpdateAuthorInput,
  executor: DatabaseExecutor = db,
): Author | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(authors)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(authors.id, id))
          .run();
      },
      () => findAuthorById(id, executor),
    ),
  );
}

export function deleteAuthor(id: string, executor: DatabaseExecutor = db): Author | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findAuthorById(id, executor),
      () => {
        executor.delete(authors).where(eq(authors.id, id)).run();
      },
    ),
  );
}
