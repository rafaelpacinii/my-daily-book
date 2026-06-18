import { db } from '../client';
import { EntityNotFoundError } from '../errors';
import type { NewReadingGoal, NewReadingGoalItem, ReadingGoal, ReadingGoalItem } from '../types';
import { findLibraryBookById } from '../repositories/library-book-repository';
import {
  createReadingGoalItem,
  createReadingGoalRecord,
} from '../repositories/reading-goal-repository';
import { nowTimestamp, runDatabaseOperation } from '../repositories/shared';

export interface CreateReadingGoalItemInput
  extends Omit<NewReadingGoalItem, 'readingGoalId' | 'createdAt' | 'updatedAt'> {
  id: string;
}

export interface CreateReadingGoalInput extends Omit<NewReadingGoal, 'createdAt' | 'updatedAt'> {
  id: string;
  items?: CreateReadingGoalItemInput[];
}

export interface CreateReadingGoalResult {
  readingGoal: ReadingGoal;
  items: ReadingGoalItem[];
}

export function createReadingGoal(input: CreateReadingGoalInput): CreateReadingGoalResult {
  return runDatabaseOperation(() =>
    db.transaction((tx) => {
      const { items: inputItems, ...readingGoalInput } = input;
      const timestamp = nowTimestamp();
      const readingGoal = createReadingGoalRecord(
        { ...readingGoalInput, createdAt: timestamp, updatedAt: timestamp },
        tx,
      );
      const items = (inputItems ?? []).map((item) => {
        const libraryBook = findLibraryBookById(item.libraryBookId, tx);

        if (!libraryBook) {
          throw new EntityNotFoundError('LibraryBook', item.libraryBookId);
        }

        return createReadingGoalItem(
          {
            ...item,
            readingGoalId: readingGoal.id,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          tx,
        );
      });

      return { readingGoal, items };
    }),
  );
}
