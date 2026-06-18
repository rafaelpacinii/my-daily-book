import { asc } from 'drizzle-orm';

import { db } from '@/src/database/client';
import {
  authors,
  bookCopies,
  bookListItems,
  bookLists,
  editions,
  libraryBooks,
  purchaseLinks,
  readingCycles,
  readingGoalItems,
  readingGoals,
  readingLogs,
  workAuthors,
  works,
} from '@/src/database/schema';
import type {
  Author,
  BookCopy,
  BookList,
  BookListItem,
  Edition,
  LibraryBook,
  PurchaseLink,
  ReadingCycle,
  ReadingGoal,
  ReadingGoalItem,
  ReadingLog,
  Work,
  WorkAuthor,
} from '@/src/database/types';

export interface ReadModelSnapshot {
  authors: Author[];
  works: Work[];
  workAuthors: WorkAuthor[];
  editions: Edition[];
  libraryBooks: LibraryBook[];
  bookCopies: BookCopy[];
  readingCycles: ReadingCycle[];
  readingLogs: ReadingLog[];
  bookLists: BookList[];
  bookListItems: BookListItem[];
  purchaseLinks: PurchaseLink[];
  readingGoals: ReadingGoal[];
  readingGoalItems: ReadingGoalItem[];
}

export function readModelSnapshot(): ReadModelSnapshot {
  return db.transaction((tx) => ({
    authors: tx.select().from(authors).orderBy(asc(authors.name), asc(authors.id)).all(),
    works: tx.select().from(works).orderBy(asc(works.title), asc(works.id)).all(),
    workAuthors: tx.select().from(workAuthors).orderBy(asc(workAuthors.workId), asc(workAuthors.position), asc(workAuthors.authorId)).all(),
    editions: tx.select().from(editions).orderBy(asc(editions.workId), asc(editions.publishedDate), asc(editions.title), asc(editions.id)).all(),
    libraryBooks: tx.select().from(libraryBooks).orderBy(asc(libraryBooks.addedAt), asc(libraryBooks.id)).all(),
    bookCopies: tx.select().from(bookCopies).orderBy(asc(bookCopies.libraryBookId), asc(bookCopies.createdAt), asc(bookCopies.id)).all(),
    readingCycles: tx.select().from(readingCycles).orderBy(asc(readingCycles.libraryBookId), asc(readingCycles.cycleNumber), asc(readingCycles.id)).all(),
    readingLogs: tx.select().from(readingLogs).orderBy(asc(readingLogs.readingDate), asc(readingLogs.createdAt), asc(readingLogs.id)).all(),
    bookLists: tx.select().from(bookLists).orderBy(asc(bookLists.createdAt), asc(bookLists.id)).all(),
    bookListItems: tx.select().from(bookListItems).orderBy(asc(bookListItems.bookListId), asc(bookListItems.position), asc(bookListItems.addedAt), asc(bookListItems.id)).all(),
    purchaseLinks: tx.select().from(purchaseLinks).orderBy(asc(purchaseLinks.bookListItemId), asc(purchaseLinks.storeName), asc(purchaseLinks.id)).all(),
    readingGoals: tx.select().from(readingGoals).orderBy(asc(readingGoals.targetDate), asc(readingGoals.id)).all(),
    readingGoalItems: tx.select().from(readingGoalItems).orderBy(asc(readingGoalItems.readingGoalId), asc(readingGoalItems.position), asc(readingGoalItems.addedAt), asc(readingGoalItems.id)).all(),
  }));
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();

  items.forEach((item) => {
    const value = key(item);
    map.set(value, [...(map.get(value) ?? []), item]);
  });

  return map;
}

export function findAuthorsForWork(snapshot: ReadModelSnapshot, workId: string): Author[] {
  return snapshot.workAuthors
    .filter((row) => row.workId === workId)
    .sort((left, right) => left.position - right.position || left.authorId.localeCompare(right.authorId))
    .flatMap((row) => {
      const author = snapshot.authors.find((item) => item.id === row.authorId);
      return author ? [author] : [];
    });
}

export function pagesRead(startPage: number, endPage: number): number {
  return endPage - startPage + 1;
}

export function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

