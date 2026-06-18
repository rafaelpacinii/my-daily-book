import { db } from '@/src/database/client';
import { EntityNotFoundError } from '@/src/database/errors';
import {
  listReadingCyclesByLibraryBookId,
  updateLibraryBook,
} from '@/src/database/repositories';
import type { DatabaseTransaction } from '@/src/database/repositories/shared';
import { isDatabaseError, mapDatabaseError } from '@/src/database/repositories/shared';
import type { BookCopy, Edition, LibraryBook, ReadingCycle, ReadingLog } from '@/src/database/types';
import { DomainError, EditionMismatchError, BookCopyMismatchError } from '@/src/domain/errors';
import { systemClock, type Clock, type IdGenerator } from '@/src/domain/shared';
import { determineLibraryBookStatus } from '@/src/domain/reading';
import { expoCryptoIdGenerator } from '@/src/infrastructure/ids/expo-id-generator';

export interface UseCaseDependencies {
  clock?: Clock;
  idGenerator?: IdGenerator;
}

export interface ResolvedUseCaseDependencies {
  clock: Clock;
  idGenerator: IdGenerator;
}

export function resolveUseCaseDependencies(
  dependencies: UseCaseDependencies = {},
): ResolvedUseCaseDependencies {
  return {
    clock: dependencies.clock ?? systemClock,
    idGenerator: dependencies.idGenerator ?? expoCryptoIdGenerator,
  };
}

export function runUseCaseTransaction<T>(operation: (tx: DatabaseTransaction) => T): T {
  try {
    return db.transaction((tx) => operation(tx));
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }

    if (!isDatabaseError(error)) {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}

export function requireEntity<T>(entity: T | null, entityName: string, id: string): T {
  if (!entity) {
    throw new EntityNotFoundError(entityName, id);
  }

  return entity;
}

export function assertEditionBelongsToLibraryBook(
  edition: Edition,
  libraryBook: LibraryBook,
): void {
  if (edition.workId !== libraryBook.workId) {
    throw new EditionMismatchError('edition must belong to the same work as the library book.');
  }
}

export function assertCopyMatchesReadingTarget(
  copy: BookCopy,
  libraryBookId: string,
  editionId: string,
): void {
  if (copy.libraryBookId !== libraryBookId) {
    throw new BookCopyMismatchError('book copy must belong to the library book.');
  }

  if (copy.editionId !== editionId) {
    throw new BookCopyMismatchError('book copy must point to the selected edition.');
  }
}

export function recalculateLibraryBookStatus(
  libraryBookId: string,
  tx: DatabaseTransaction,
): LibraryBook {
  const cycles = listReadingCyclesByLibraryBookId(libraryBookId, tx);
  const status = determineLibraryBookStatus(cycles);
  const updated = updateLibraryBook(libraryBookId, { status }, tx);

  return requireEntity(updated, 'LibraryBook', libraryBookId);
}

export function findPreviousReadingLog(
  logs: ReadingLog[],
  currentLogId?: string,
): ReadingLog | null {
  const eligibleLogs = currentLogId ? logs.filter((log) => log.id !== currentLogId) : logs;

  return eligibleLogs[eligibleLogs.length - 1] ?? null;
}

export function getLastReadAt(logs: ReadingLog[]): string | null {
  return logs[logs.length - 1]?.readingDate ?? null;
}

export function hasCompletedCycleInDateRange(
  cycles: ReadingCycle[],
  startDate: string,
  targetDate: string,
): string | null {
  const completedCycles = cycles
    .filter((cycle) => cycle.status === 'completed' && cycle.finishedAt)
    .filter((cycle) => {
      const finishedAt = cycle.finishedAt;

      return finishedAt != null && finishedAt >= startDate && finishedAt <= targetDate;
    })
    .sort((left, right) => (left.finishedAt ?? '').localeCompare(right.finishedAt ?? ''));

  return completedCycles[0]?.finishedAt ?? null;
}
