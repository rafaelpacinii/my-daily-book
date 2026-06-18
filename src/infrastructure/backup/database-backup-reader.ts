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
import type { BackupData } from '@/src/domain/backup';
import { readPersistedBookCoverForBackup } from '@/src/infrastructure/library/book-cover-storage';

export async function readBackupData(): Promise<BackupData> {
  const snapshot = db.transaction((tx) => ({
    authors: tx.select().from(authors).orderBy(asc(authors.id)).all(),
    works: tx.select().from(works).orderBy(asc(works.id)).all(),
    workAuthors: tx.select().from(workAuthors).orderBy(asc(workAuthors.workId), asc(workAuthors.authorId)).all(),
    editions: tx.select().from(editions).orderBy(asc(editions.id)).all(),
    libraryBooks: tx.select().from(libraryBooks).orderBy(asc(libraryBooks.id)).all(),
    bookCopies: tx.select().from(bookCopies).orderBy(asc(bookCopies.id)).all(),
    readingCycles: tx.select().from(readingCycles).orderBy(asc(readingCycles.id)).all(),
    readingLogs: tx.select().from(readingLogs).orderBy(asc(readingLogs.id)).all(),
    bookLists: tx.select().from(bookLists).orderBy(asc(bookLists.id)).all(),
    bookListItems: tx.select().from(bookListItems).orderBy(asc(bookListItems.id)).all(),
    purchaseLinks: tx.select().from(purchaseLinks).orderBy(asc(purchaseLinks.id)).all(),
    readingGoals: tx.select().from(readingGoals).orderBy(asc(readingGoals.id)).all(),
    readingGoalItems: tx.select().from(readingGoalItems).orderBy(asc(readingGoalItems.id)).all(),
  }));

  const coverAssets = (
    await Promise.all(
      snapshot.editions
        .filter((edition) => edition.coverSource === 'local' && edition.coverUrl != null)
        .map((edition) =>
          readPersistedBookCoverForBackup(
            edition.id,
            edition.coverUrl ?? '',
            edition.coverMimeType,
            edition.coverFileName,
          ),
        ),
    )
  ).flatMap((asset) => (asset ? [asset] : []));

  return {
    ...snapshot,
    coverAssets,
  };
}
