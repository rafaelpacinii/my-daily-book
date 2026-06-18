import { db } from '../client';
import { EntityNotFoundError } from '../errors';
import type { NewReadingLog, ReadingCycle, ReadingLog } from '../types';
import { findReadingCycleById, updateReadingCycle } from '../repositories/reading-cycle-repository';
import { createReadingLogRecord } from '../repositories/reading-log-repository';
import { nowTimestamp, runDatabaseOperation } from '../repositories/shared';

export interface CreateReadingLogInput extends Omit<NewReadingLog, 'createdAt' | 'updatedAt'> {
  id: string;
}

export interface CreateReadingLogResult {
  readingLog: ReadingLog;
  readingCycle: ReadingCycle;
}

export function createReadingLog(input: CreateReadingLogInput): CreateReadingLogResult {
  return runDatabaseOperation(() =>
    db.transaction((tx) => {
      const cycle = findReadingCycleById(input.readingCycleId, tx);

      if (!cycle) {
        throw new EntityNotFoundError('ReadingCycle', input.readingCycleId);
      }

      const timestamp = nowTimestamp();
      const readingLog = createReadingLogRecord(
        { ...input, createdAt: timestamp, updatedAt: timestamp },
        tx,
      );
      const readingCycle = updateReadingCycle(
        cycle.id,
        { lastReadAt: input.readingDate, updatedAt: timestamp },
        tx,
      );

      if (!readingCycle) {
        throw new EntityNotFoundError('ReadingCycle', input.readingCycleId);
      }

      return { readingLog, readingCycle };
    }),
  );
}
