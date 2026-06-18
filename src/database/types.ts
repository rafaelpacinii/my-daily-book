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
} from './schema';

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;

export type Work = typeof works.$inferSelect;
export type NewWork = typeof works.$inferInsert;

export type WorkAuthor = typeof workAuthors.$inferSelect;
export type NewWorkAuthor = typeof workAuthors.$inferInsert;

export type Edition = typeof editions.$inferSelect;
export type NewEdition = typeof editions.$inferInsert;

export type LibraryBook = typeof libraryBooks.$inferSelect;
export type NewLibraryBook = typeof libraryBooks.$inferInsert;

export type BookCopy = typeof bookCopies.$inferSelect;
export type NewBookCopy = typeof bookCopies.$inferInsert;

export type ReadingCycle = typeof readingCycles.$inferSelect;
export type NewReadingCycle = typeof readingCycles.$inferInsert;

export type ReadingLog = typeof readingLogs.$inferSelect;
export type NewReadingLog = typeof readingLogs.$inferInsert;

export type BookList = typeof bookLists.$inferSelect;
export type NewBookList = typeof bookLists.$inferInsert;

export type BookListItem = typeof bookListItems.$inferSelect;
export type NewBookListItem = typeof bookListItems.$inferInsert;

export type PurchaseLink = typeof purchaseLinks.$inferSelect;
export type NewPurchaseLink = typeof purchaseLinks.$inferInsert;

export type ReadingGoal = typeof readingGoals.$inferSelect;
export type NewReadingGoal = typeof readingGoals.$inferInsert;

export type ReadingGoalItem = typeof readingGoalItems.$inferSelect;
export type NewReadingGoalItem = typeof readingGoalItems.$inferInsert;
