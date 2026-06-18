import { findEditionById } from '@/src/database/repositories';
import {
  findReadingCycleById,
  updateReadingCycle,
} from '@/src/database/repositories/reading-cycle-repository';
import {
  createReadingLogRecord,
  deleteReadingLog as deleteReadingLogRecord,
  findReadingLogById,
  listReadingLogsByReadingCycleId,
  updateReadingLog as updateReadingLogRecord,
} from '@/src/database/repositories/reading-log-repository';
import type { ReadingLog } from '@/src/database/types';
import { ReadingCycleNotActiveError, ValidationError } from '@/src/domain/errors';
import {
  assertNoOverlappingPages,
  assertReadingContinuity,
  calculatePagesRead,
  calculateReadingProgress,
  checkReadingContinuity,
  deriveCurrentPageFromLogs,
  validatePageRange,
  validateReadingDate,
  type ReadingContinuityResult,
} from '@/src/domain/reading';

import {
  findPreviousReadingLog,
  getLastReadAt,
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface CreateReadingLogInput {
  readingCycleId: string;
  readingDate: string;
  startPage: number;
  endPage: number;
  durationSeconds?: number | null;
  notes?: string | null;
  allowDiscontinuousPages?: boolean;
  allowOverlappingPages?: boolean;
}

export interface UpdateReadingLogInput extends Partial<CreateReadingLogInput> {
  id: string;
}

export interface ReadingLogUseCaseResult {
  readingLog: ReadingLog;
  pagesRead: number;
  progressPercentage: number | null;
  continuity: ReadingContinuityResult;
}

export function createReadingLog(
  input: CreateReadingLogInput,
  dependencies?: UseCaseDependencies,
): ReadingLogUseCaseResult {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const cycle = requireEntity(
      findReadingCycleById(input.readingCycleId, tx),
      'ReadingCycle',
      input.readingCycleId,
    );

    if (cycle.status !== 'reading') {
      throw new ReadingCycleNotActiveError('reading logs can only be added to active cycles.');
    }

    const edition = requireEntity(findEditionById(cycle.editionId, tx), 'Edition', cycle.editionId);
    validateReadingDate(input.readingDate, clock.today(), cycle);
    validatePageRange(input.startPage, input.endPage, edition.pageCount);
    validateDuration(input.durationSeconds);

    const existingLogs = listReadingLogsByReadingCycleId(cycle.id, tx);
    const continuity = checkReadingContinuity(findPreviousReadingLog(existingLogs), input.startPage);
    assertReadingContinuity(continuity, input.allowDiscontinuousPages);
    assertNoOverlappingPages(existingLogs, input, input.allowOverlappingPages);

    const timestamp = clock.now();
    const readingLog = createReadingLogRecord(
      {
        id: idGenerator.generate(),
        readingCycleId: cycle.id,
        readingDate: input.readingDate,
        startPage: input.startPage,
        endPage: input.endPage,
        durationSeconds: input.durationSeconds ?? null,
        notes: input.notes ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
    const updatedLogs = listReadingLogsByReadingCycleId(cycle.id, tx);
    updateReadingCycle(cycle.id, { lastReadAt: getLastReadAt(updatedLogs) }, tx);

    return buildReadingLogResult(readingLog, updatedLogs, edition.pageCount, continuity);
  });
}

export function updateReadingLog(
  input: UpdateReadingLogInput,
  dependencies?: UseCaseDependencies,
): ReadingLogUseCaseResult {
  const { clock } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const existingLog = requireEntity(findReadingLogById(input.id, tx), 'ReadingLog', input.id);
    const cycle = requireEntity(
      findReadingCycleById(existingLog.readingCycleId, tx),
      'ReadingCycle',
      existingLog.readingCycleId,
    );
    const edition = requireEntity(findEditionById(cycle.editionId, tx), 'Edition', cycle.editionId);
    const nextLog = {
      ...existingLog,
      readingDate: input.readingDate ?? existingLog.readingDate,
      startPage: input.startPage ?? existingLog.startPage,
      endPage: input.endPage ?? existingLog.endPage,
      durationSeconds:
        input.durationSeconds === undefined ? existingLog.durationSeconds : input.durationSeconds,
      notes: input.notes === undefined ? existingLog.notes : input.notes,
    };

    validateReadingDate(nextLog.readingDate, clock.today(), cycle);
    validatePageRange(nextLog.startPage, nextLog.endPage, edition.pageCount);
    validateDuration(nextLog.durationSeconds);

    const otherLogs = listReadingLogsByReadingCycleId(cycle.id, tx).filter((log) => log.id !== input.id);
    const continuity = checkReadingContinuity(findPreviousReadingLog(otherLogs), nextLog.startPage);
    assertReadingContinuity(continuity, input.allowDiscontinuousPages);
    assertNoOverlappingPages(otherLogs, nextLog, input.allowOverlappingPages);

    const readingLog = requireEntity(
      updateReadingLogRecord(
        input.id,
        {
          readingDate: nextLog.readingDate,
          startPage: nextLog.startPage,
          endPage: nextLog.endPage,
          durationSeconds: nextLog.durationSeconds,
          notes: nextLog.notes,
        },
        tx,
      ),
      'ReadingLog',
      input.id,
    );
    const updatedLogs = listReadingLogsByReadingCycleId(cycle.id, tx);
    updateReadingCycle(cycle.id, { lastReadAt: getLastReadAt(updatedLogs) }, tx);

    return buildReadingLogResult(readingLog, updatedLogs, edition.pageCount, continuity);
  });
}

export function deleteReadingLog(id: string): ReadingLog {
  return runUseCaseTransaction((tx) => {
    const existingLog = requireEntity(findReadingLogById(id, tx), 'ReadingLog', id);
    const cycle = requireEntity(
      findReadingCycleById(existingLog.readingCycleId, tx),
      'ReadingCycle',
      existingLog.readingCycleId,
    );

    if (cycle.status === 'completed') {
      throw new ValidationError('completed cycles cannot lose reading logs without correction.');
    }

    const deleted = requireEntity(deleteReadingLogRecord(id, tx), 'ReadingLog', id);
    const updatedLogs = listReadingLogsByReadingCycleId(cycle.id, tx);
    updateReadingCycle(cycle.id, { lastReadAt: getLastReadAt(updatedLogs) }, tx);

    return deleted;
  });
}

function buildReadingLogResult(
  readingLog: ReadingLog,
  logs: ReadingLog[],
  pageCount: number | null,
  continuity: ReadingContinuityResult,
): ReadingLogUseCaseResult {
  const currentPage = deriveCurrentPageFromLogs(logs);

  return {
    readingLog,
    pagesRead: calculatePagesRead(readingLog.startPage, readingLog.endPage),
    progressPercentage: calculateReadingProgress(currentPage, pageCount),
    continuity,
  };
}

function validateDuration(durationSeconds?: number | null): void {
  if (durationSeconds != null && durationSeconds <= 0) {
    throw new ValidationError('duration seconds must be greater than zero when provided.');
  }
}
