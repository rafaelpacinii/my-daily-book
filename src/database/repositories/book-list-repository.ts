import { and, asc, eq, isNull } from 'drizzle-orm';

import { db } from '../client';
import { bookLists, bookListItems } from '../schema/book-lists';
import { editions } from '../schema/editions';
import { works } from '../schema/works';

import type { BookList, BookListItem, Edition, NewBookList, NewBookListItem, Work } from '../types';
import type { BookListType } from '../schema/book-lists';
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

export type UpdateBookListInput = Partial<Omit<NewBookList, 'id' | 'createdAt'>>;
export type UpdateBookListItemInput = Partial<Omit<NewBookListItem, 'id' | 'createdAt'>>;

export interface BookListItemWithBook {
  item: BookListItem;
  work: Work;
  edition: Edition | null;
}

export interface BookListWithItems {
  bookList: BookList;
  items: BookListItemWithBook[];
}

export function createBookListRecord(
  input: NewBookList,
  executor: DatabaseExecutor = db,
): BookList {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(bookLists).values(sanitizePersistenceRecord(input)).run();
      },
      () => findBookListById(input.id, executor),
    ),
  );
}

export function findBookListById(id: string, executor: DatabaseExecutor = db): BookList | null {
  return firstOrNull(executor.select().from(bookLists).where(eq(bookLists.id, id)).limit(1).all());
}

export function listBookLists(
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): BookList[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(bookLists)
    .orderBy(asc(bookLists.createdAt), asc(bookLists.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function listBookListsByType(
  type: BookListType,
  pagination?: PaginationInput,
  executor: DatabaseExecutor = db,
): BookList[] {
  const { limit, offset } = getPagination(pagination);

  return executor
    .select()
    .from(bookLists)
    .where(eq(bookLists.type, type))
    .orderBy(asc(bookLists.createdAt), asc(bookLists.id))
    .limit(limit)
    .offset(offset)
    .all();
}

export function updateBookList(
  id: string,
  input: UpdateBookListInput,
  executor: DatabaseExecutor = db,
): BookList | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(bookLists)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(bookLists.id, id))
          .run();
      },
      () => findBookListById(id, executor),
    ),
  );
}

export function deleteBookList(id: string, executor: DatabaseExecutor = db): BookList | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findBookListById(id, executor),
      () => {
        executor.delete(bookLists).where(eq(bookLists.id, id)).run();
      },
    ),
  );
}

export function createBookListItem(
  input: NewBookListItem,
  executor: DatabaseExecutor = db,
): BookListItem {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(bookListItems).values(sanitizePersistenceRecord(input)).run();
      },
      () => findBookListItemById(input.id, executor),
    ),
  );
}

export function findBookListItemById(
  id: string,
  executor: DatabaseExecutor = db,
): BookListItem | null {
  return firstOrNull(
    executor.select().from(bookListItems).where(eq(bookListItems.id, id)).limit(1).all(),
  );
}

export function listBookListItems(
  bookListId: string,
  executor: DatabaseExecutor = db,
): BookListItem[] {
  return executor
    .select()
    .from(bookListItems)
    .where(eq(bookListItems.bookListId, bookListId))
    .orderBy(asc(bookListItems.position), asc(bookListItems.addedAt), asc(bookListItems.id))
    .all();
}

export function updateBookListItem(
  id: string,
  input: UpdateBookListItemInput,
  executor: DatabaseExecutor = db,
): BookListItem | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(bookListItems)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(bookListItems.id, id))
          .run();
      },
      () => findBookListItemById(id, executor),
    ),
  );
}

export function deleteBookListItem(
  id: string,
  executor: DatabaseExecutor = db,
): BookListItem | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findBookListItemById(id, executor),
      () => {
        executor.delete(bookListItems).where(eq(bookListItems.id, id)).run();
      },
    ),
  );
}

export function findBookListWithItems(
  id: string,
  executor: DatabaseExecutor = db,
): BookListWithItems | null {
  const bookList = findBookListById(id, executor);

  if (!bookList) {
    return null;
  }

  const items = executor
    .select({ item: bookListItems, work: works, edition: editions })
    .from(bookListItems)
    .innerJoin(works, eq(works.id, bookListItems.workId))
    .leftJoin(editions, eq(editions.id, bookListItems.editionId))
    .where(eq(bookListItems.bookListId, id))
    .orderBy(asc(bookListItems.position), asc(bookListItems.addedAt), asc(bookListItems.id))
    .all();

  return { bookList, items };
}

export function findBookListItemForBook(
  bookListId: string,
  workId: string,
  editionId: string | null,
  executor: DatabaseExecutor = db,
): BookListItem | null {
  const editionFilter = editionId ? eq(bookListItems.editionId, editionId) : isNull(bookListItems.editionId);

  return firstOrNull(
    executor
    .select()
    .from(bookListItems)
      .where(and(eq(bookListItems.bookListId, bookListId), eq(bookListItems.workId, workId), editionFilter))
    .orderBy(asc(bookListItems.position), asc(bookListItems.id))
      .limit(1)
      .all(),
  );
}
