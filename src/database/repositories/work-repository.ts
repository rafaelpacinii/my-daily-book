import { and, asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { authors } from '../schema/authors';
import { editions } from '../schema/editions';
import { works, workAuthors } from '../schema/works';
import type { Author, Edition, NewWork, NewWorkAuthor, Work, WorkAuthor } from '../types';
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

export type UpdateWorkInput = Partial<Omit<NewWork, 'id' | 'createdAt'>>;

export interface WorkWithAuthor {
  work: Work;
  workAuthor: WorkAuthor;
  author: Author;
}

export interface WorkWithEdition {
  work: Work;
  edition: Edition;
}

export function createWork(input: NewWork, executor: DatabaseExecutor = db): Work {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(works).values(sanitizePersistenceRecord(input)).run();
      },
      () => findWorkById(input.id, executor),
    ),
  );
}

export function createWorkAuthor(
  input: NewWorkAuthor,
  executor: DatabaseExecutor = db,
): WorkAuthor {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(workAuthors).values(sanitizePersistenceRecord(input)).run();
      },
      () => findWorkAuthor(input.workId, input.authorId, executor),
    ),
  );
}

export function findWorkAuthor(
  workId: string,
  authorId: string,
  executor: DatabaseExecutor = db,
): WorkAuthor | null {
  return firstOrNull(
    executor
      .select()
      .from(workAuthors)
    .where(and(eq(workAuthors.workId, workId), eq(workAuthors.authorId, authorId)))
      .limit(1)
      .all(),
  );
}

export function findWorkById(id: string, executor: DatabaseExecutor = db): Work | null {
  return firstOrNull(executor.select().from(works).where(eq(works.id, id)).limit(1).all());
}

export function findWorksByTitle(
  title: string,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): Work[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(works)
    .where(eq(works.title, title))
    .orderBy(asc(works.title), asc(works.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listWorks(pagination?: PaginationInput, executor: DatabaseExecutor = db): Work[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(works)
    .orderBy(asc(works.title), asc(works.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function updateWork(
  id: string,
  input: UpdateWorkInput,
  executor: DatabaseExecutor = db,
): Work | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(works)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(works.id, id))
          .run();
      },
      () => findWorkById(id, executor),
    ),
  );
}

export function deleteWork(id: string, executor: DatabaseExecutor = db): Work | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findWorkById(id, executor),
      () => {
        executor.delete(works).where(eq(works.id, id)).run();
      },
    ),
  );
}

export function findWorkWithAuthors(
  id: string,
  executor: DatabaseExecutor = db,
): WorkWithAuthor[] {
  return executor
    .select({ work: works, workAuthor: workAuthors, author: authors })
    .from(works)
    .innerJoin(workAuthors, eq(workAuthors.workId, works.id))
    .innerJoin(authors, eq(authors.id, workAuthors.authorId))
    .where(eq(works.id, id))
    .orderBy(asc(workAuthors.position), asc(authors.name), asc(authors.id))
    .all();
}

export function findWorkWithEditions(
  id: string,
  executor: DatabaseExecutor = db,
): WorkWithEdition[] {
  return executor
    .select({ work: works, edition: editions })
    .from(works)
    .innerJoin(editions, eq(editions.workId, works.id))
    .where(eq(works.id, id))
    .orderBy(asc(editions.publishedDate), asc(editions.title), asc(editions.id))
    .all();
}
