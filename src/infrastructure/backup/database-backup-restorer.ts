import { db, sqlite } from '@/src/database/client';
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
import {
  BackupRestoreError,
  countBackupData,
  type BackupData,
  type RestoreBackupResult,
} from '@/src/domain/backup';
import { restorePersistedBookCover } from '@/src/infrastructure/library/book-cover-storage';

export async function replaceDatabaseWithBackup(
  data: BackupData,
  restoredAt: number,
  safetyBackupUri: string | null,
): Promise<RestoreBackupResult> {
  try {
    const restoredCoverMap = new Map(
      (
        await Promise.all(
          data.coverAssets.map(async (asset) => [
            asset.editionId,
            await restorePersistedBookCover(asset),
          ] as const),
        )
      ),
    );

    return db.transaction((tx) => {
      sqlite.execSync('PRAGMA foreign_keys = ON;');
      tx.delete(purchaseLinks).run();
      tx.delete(bookListItems).run();
      tx.delete(bookLists).run();
      tx.delete(readingGoalItems).run();
      tx.delete(readingGoals).run();
      tx.delete(readingLogs).run();
      tx.delete(readingCycles).run();
      tx.delete(bookCopies).run();
      tx.delete(libraryBooks).run();
      tx.delete(editions).run();
      tx.delete(workAuthors).run();
      tx.delete(works).run();
      tx.delete(authors).run();

      if (data.authors.length > 0) tx.insert(authors).values(data.authors).run();
      if (data.works.length > 0) tx.insert(works).values(data.works).run();
      if (data.workAuthors.length > 0) tx.insert(workAuthors).values(data.workAuthors).run();
      if (data.editions.length > 0) {
        tx.insert(editions).values(
          data.editions.map((edition) => {
            const restoredCover = restoredCoverMap.get(edition.id);
            if (!restoredCover || restoredCover.kind !== 'local') return edition;

            return {
              ...edition,
              coverSource: 'local',
              coverUrl: restoredCover.uri,
              coverMimeType: restoredCover.mimeType,
              coverFileName: restoredCover.fileName,
            };
          }),
        ).run();
      }
      if (data.libraryBooks.length > 0) tx.insert(libraryBooks).values(data.libraryBooks).run();
      if (data.bookCopies.length > 0) tx.insert(bookCopies).values(data.bookCopies).run();
      if (data.readingCycles.length > 0) tx.insert(readingCycles).values(data.readingCycles).run();
      if (data.readingLogs.length > 0) tx.insert(readingLogs).values(data.readingLogs).run();
      if (data.bookLists.length > 0) tx.insert(bookLists).values(data.bookLists).run();
      if (data.bookListItems.length > 0) tx.insert(bookListItems).values(data.bookListItems).run();
      if (data.purchaseLinks.length > 0) tx.insert(purchaseLinks).values(data.purchaseLinks).run();
      if (data.readingGoals.length > 0) tx.insert(readingGoals).values(data.readingGoals).run();
      if (data.readingGoalItems.length > 0) tx.insert(readingGoalItems).values(data.readingGoalItems).run();

      return {
        restoredAt,
        safetyBackupUri,
        counts: countBackupData(data),
      };
    });
  } catch (error) {
    throw new BackupRestoreError('Backup restore failed and was rolled back.', { cause: error });
  }
}
