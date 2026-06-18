import { findBookCopyById, findEditionById, findLibraryBookById } from '@/src/database/repositories';
import {
  createReadingCycleRecord,
  findActiveReadingCycleByLibraryBookId,
  findLatestReadingCycleByLibraryBookId,
} from '@/src/database/repositories/reading-cycle-repository';
import type { ReadingCycle } from '@/src/database/types';
import { ActiveReadingCycleError } from '@/src/domain/errors';
import { assertValidIsoDate, isFutureDate } from '@/src/domain/shared';

import {
  assertCopyMatchesReadingTarget,
  assertEditionBelongsToLibraryBook,
  recalculateLibraryBookStatus,
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface StartReadingCycleInput {
  libraryBookId: string;
  editionId: string;
  bookCopyId?: string | null;
  startedAt: string;
  rating?: number | null;
  notes?: string | null;
}

export function startReadingCycle(
  input: StartReadingCycleInput,
  dependencies?: UseCaseDependencies,
): ReadingCycle {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  assertValidIsoDate(input.startedAt, 'cycle start date');

  if (isFutureDate(input.startedAt, clock.today())) {
    throw new ActiveReadingCycleError('reading cycle cannot start in the future.');
  }

  return runUseCaseTransaction((tx) => {
    const libraryBook = requireEntity(
      findLibraryBookById(input.libraryBookId, tx),
      'LibraryBook',
      input.libraryBookId,
    );
    const edition = requireEntity(findEditionById(input.editionId, tx), 'Edition', input.editionId);

    assertEditionBelongsToLibraryBook(edition, libraryBook);

    if (input.bookCopyId) {
      const copy = requireEntity(findBookCopyById(input.bookCopyId, tx), 'BookCopy', input.bookCopyId);
      assertCopyMatchesReadingTarget(copy, input.libraryBookId, input.editionId);
    }

    const activeCycle = findActiveReadingCycleByLibraryBookId(input.libraryBookId, tx);

    if (activeCycle) {
      throw new ActiveReadingCycleError('library book already has an active reading cycle.');
    }

    const latestCycle = findLatestReadingCycleByLibraryBookId(input.libraryBookId, tx);
    const timestamp = clock.now();
    const cycle = createReadingCycleRecord(
      {
        id: idGenerator.generate(),
        libraryBookId: input.libraryBookId,
        editionId: input.editionId,
        bookCopyId: input.bookCopyId ?? null,
        cycleNumber: latestCycle ? latestCycle.cycleNumber + 1 : 1,
        status: 'reading',
        startedAt: input.startedAt,
        finishedAt: null,
        droppedAt: null,
        lastReadAt: null,
        rating: input.rating ?? null,
        notes: input.notes ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );

    recalculateLibraryBookStatus(input.libraryBookId, tx);

    return cycle;
  });
}

