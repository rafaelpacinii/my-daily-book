import { findEditionById } from '@/src/database/repositories';
import {
  findReadingCycleById,
  updateReadingCycle,
} from '@/src/database/repositories/reading-cycle-repository';
import { listReadingLogsByReadingCycleId } from '@/src/database/repositories/reading-log-repository';
import type { ReadingCycle } from '@/src/database/types';
import { ReadingCycleNotActiveError, ValidationError } from '@/src/domain/errors';
import { compareIsoDates, isFutureDate, assertValidIsoDate } from '@/src/domain/shared';
import { recalculateReadingGoalsForLibraryBookInTransaction } from '@/src/application/use-cases/goals';

import {
  recalculateLibraryBookStatus,
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface CompleteReadingCycleInput {
  id: string;
  finishedAt: string;
  rating?: number | null;
  notes?: string | null;
}

export interface DropReadingCycleInput {
  id: string;
  droppedAt: string;
  notes?: string | null;
}

export function completeReadingCycle(
  input: CompleteReadingCycleInput,
  dependencies?: UseCaseDependencies,
): ReadingCycle {
  const { clock } = resolveUseCaseDependencies(dependencies);
  assertValidIsoDate(input.finishedAt, 'cycle finish date');

  if (isFutureDate(input.finishedAt, clock.today())) {
    throw new ValidationError('cycle finish date cannot be in the future.');
  }

  return runUseCaseTransaction((tx) => {
    const cycle = requireEntity(findReadingCycleById(input.id, tx), 'ReadingCycle', input.id);

    if (cycle.status !== 'reading') {
      throw new ReadingCycleNotActiveError('only active reading cycles can be completed.');
    }

    if (compareIsoDates(input.finishedAt, cycle.startedAt) < 0) {
      throw new ValidationError('cycle finish date cannot be before start date.');
    }

    const logs = listReadingLogsByReadingCycleId(cycle.id, tx);

    if (logs.length === 0) {
      throw new ValidationError('reading cycle needs at least one log before completion.');
    }

    const lastLog = logs[logs.length - 1];

    if (lastLog && compareIsoDates(input.finishedAt, lastLog.readingDate) < 0) {
      throw new ValidationError('cycle finish date cannot be before the latest reading log.');
    }

    const edition = requireEntity(findEditionById(cycle.editionId, tx), 'Edition', cycle.editionId);
    const highestPage = logs.reduce((highest, log) => Math.max(highest, log.endPage), 0);

    if (edition.pageCount != null && highestPage < edition.pageCount) {
      throw new ValidationError('reading cycle cannot be completed before reaching the last page.');
    }

    const updated = requireEntity(
      updateReadingCycle(
        cycle.id,
        {
          status: 'completed',
          finishedAt: input.finishedAt,
          droppedAt: null,
          lastReadAt: lastLog?.readingDate ?? cycle.lastReadAt,
          rating: input.rating === undefined ? cycle.rating : input.rating,
          notes: input.notes === undefined ? cycle.notes : input.notes,
        },
        tx,
      ),
      'ReadingCycle',
      cycle.id,
    );

    recalculateLibraryBookStatus(cycle.libraryBookId, tx);
    recalculateReadingGoalsForLibraryBookInTransaction(cycle.libraryBookId, tx, input.finishedAt);

    return updated;
  });
}

export function dropReadingCycle(
  input: DropReadingCycleInput,
  dependencies?: UseCaseDependencies,
): ReadingCycle {
  const { clock } = resolveUseCaseDependencies(dependencies);
  assertValidIsoDate(input.droppedAt, 'cycle drop date');

  if (isFutureDate(input.droppedAt, clock.today())) {
    throw new ValidationError('cycle drop date cannot be in the future.');
  }

  return runUseCaseTransaction((tx) => {
    const cycle = requireEntity(findReadingCycleById(input.id, tx), 'ReadingCycle', input.id);

    if (cycle.status !== 'reading') {
      throw new ReadingCycleNotActiveError('only active reading cycles can be dropped.');
    }

    if (compareIsoDates(input.droppedAt, cycle.startedAt) < 0) {
      throw new ValidationError('cycle drop date cannot be before start date.');
    }

    const updated = requireEntity(
      updateReadingCycle(
        cycle.id,
        {
          status: 'dropped',
          droppedAt: input.droppedAt,
          finishedAt: null,
          notes: input.notes === undefined ? cycle.notes : input.notes,
        },
        tx,
      ),
      'ReadingCycle',
      cycle.id,
    );

    recalculateLibraryBookStatus(cycle.libraryBookId, tx);

    return updated;
  });
}
