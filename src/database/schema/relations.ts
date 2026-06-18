import { relations } from 'drizzle-orm';

import { authors } from './authors';
import { bookCopies } from './book-copies';
import { bookListItems, bookLists } from './book-lists';
import { editions } from './editions';
import { libraryBooks } from './library-books';
import { purchaseLinks } from './purchase-links';
import { readingCycles } from './reading-cycles';
import { readingGoalItems, readingGoals } from './reading-goals';
import { readingLogs } from './reading-logs';
import { workAuthors, works } from './works';

export const authorsRelations = relations(authors, ({ many }) => ({
  workAuthors: many(workAuthors),
}));

export const worksRelations = relations(works, ({ many, one }) => ({
  workAuthors: many(workAuthors),
  editions: many(editions),
  libraryBook: one(libraryBooks),
  bookListItems: many(bookListItems),
}));

export const workAuthorsRelations = relations(workAuthors, ({ one }) => ({
  work: one(works, {
    fields: [workAuthors.workId],
    references: [works.id],
  }),
  author: one(authors, {
    fields: [workAuthors.authorId],
    references: [authors.id],
  }),
}));

export const editionsRelations = relations(editions, ({ many, one }) => ({
  work: one(works, {
    fields: [editions.workId],
    references: [works.id],
  }),
  bookCopies: many(bookCopies),
  readingCycles: many(readingCycles),
  bookListItems: many(bookListItems),
}));

export const libraryBooksRelations = relations(libraryBooks, ({ many, one }) => ({
  work: one(works, {
    fields: [libraryBooks.workId],
    references: [works.id],
  }),
  bookCopies: many(bookCopies),
  readingCycles: many(readingCycles),
  readingGoalItems: many(readingGoalItems),
}));

export const bookCopiesRelations = relations(bookCopies, ({ many, one }) => ({
  libraryBook: one(libraryBooks, {
    fields: [bookCopies.libraryBookId],
    references: [libraryBooks.id],
  }),
  edition: one(editions, {
    fields: [bookCopies.editionId],
    references: [editions.id],
  }),
  readingCycles: many(readingCycles),
}));

export const readingCyclesRelations = relations(readingCycles, ({ many, one }) => ({
  libraryBook: one(libraryBooks, {
    fields: [readingCycles.libraryBookId],
    references: [libraryBooks.id],
  }),
  edition: one(editions, {
    fields: [readingCycles.editionId],
    references: [editions.id],
  }),
  bookCopy: one(bookCopies, {
    fields: [readingCycles.bookCopyId],
    references: [bookCopies.id],
  }),
  readingLogs: many(readingLogs),
}));

export const readingLogsRelations = relations(readingLogs, ({ one }) => ({
  readingCycle: one(readingCycles, {
    fields: [readingLogs.readingCycleId],
    references: [readingCycles.id],
  }),
}));

export const bookListsRelations = relations(bookLists, ({ many }) => ({
  bookListItems: many(bookListItems),
}));

export const bookListItemsRelations = relations(bookListItems, ({ many, one }) => ({
  bookList: one(bookLists, {
    fields: [bookListItems.bookListId],
    references: [bookLists.id],
  }),
  work: one(works, {
    fields: [bookListItems.workId],
    references: [works.id],
  }),
  edition: one(editions, {
    fields: [bookListItems.editionId],
    references: [editions.id],
  }),
  purchaseLinks: many(purchaseLinks),
}));

export const purchaseLinksRelations = relations(purchaseLinks, ({ one }) => ({
  bookListItem: one(bookListItems, {
    fields: [purchaseLinks.bookListItemId],
    references: [bookListItems.id],
  }),
}));

export const readingGoalsRelations = relations(readingGoals, ({ many }) => ({
  readingGoalItems: many(readingGoalItems),
}));

export const readingGoalItemsRelations = relations(readingGoalItems, ({ one }) => ({
  readingGoal: one(readingGoals, {
    fields: [readingGoalItems.readingGoalId],
    references: [readingGoals.id],
  }),
  libraryBook: one(libraryBooks, {
    fields: [readingGoalItems.libraryBookId],
    references: [libraryBooks.id],
  }),
}));
