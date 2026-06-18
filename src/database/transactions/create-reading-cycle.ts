import { db } from '../client';
import { EntityNotFoundError } from '../errors';
import type { NewReadingCycle, ReadingCycle } from '../types';
import { findBookCopyById } from '../repositories/book-copy-repository';
import { findEditionById } from '../repositories/edition-repository';
import { findLibraryBookById } from '../repositories/library-book-repository';
import {
  createReadingCycleRecord,
  findLatestReadingCycleByLibraryBookId,
} from '../repositories/reading-cycle-repository';
import { nowTimestamp, runDatabaseOperation } from '../repositories/shared';

export interface CreateReadingCycleInput
  extends Omit<NewReadingCycle, 'cycleNumber' | 'createdAt' | 'updatedAt'> {
  id: string;
}

export function createReadingCycle(input: CreateReadingCycleInput): ReadingCycle {
  return runDatabaseOperation(() =>
    db.transaction((tx) => {
      const libraryBook = findLibraryBookById(input.libraryBookId, tx);

      if (!libraryBook) {
        throw new EntityNotFoundError('LibraryBook', input.libraryBookId);
      }

      const edition = findEditionById(input.editionId, tx);

      if (!edition) {
        throw new EntityNotFoundError('Edition', input.editionId);
      }

      if (input.bookCopyId) {
        const copy = findBookCopyById(input.bookCopyId, tx);

        if (!copy) {
          throw new EntityNotFoundError('BookCopy', input.bookCopyId);
        }

        if (copy.libraryBookId !== input.libraryBookId || copy.editionId !== input.editionId) {
          throw new EntityNotFoundError('BookCopy', input.bookCopyId);
        }
      }

      const latestCycle = findLatestReadingCycleByLibraryBookId(input.libraryBookId, tx);
      const timestamp = nowTimestamp();

      return createReadingCycleRecord(
        {
          ...input,
          cycleNumber: latestCycle ? latestCycle.cycleNumber + 1 : 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        tx,
      );
    }),
  );
}
