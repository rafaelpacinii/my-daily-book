import { FutureReadingDateError, InvalidDateError } from '../../errors';
import { assertValidIsoDate, compareIsoDates, isFutureDate } from '../../shared';
import type { ReadingCycleDateBounds } from '../types';

export function validateReadingDate(
  readingDate: string,
  today: string,
  cycle?: ReadingCycleDateBounds,
): void {
  assertValidIsoDate(readingDate, 'reading date');
  assertValidIsoDate(today, 'today');

  if (isFutureDate(readingDate, today)) {
    throw new FutureReadingDateError('reading date cannot be in the future.');
  }

  if (!cycle) {
    return;
  }

  assertValidIsoDate(cycle.startedAt, 'cycle start date');

  if (compareIsoDates(readingDate, cycle.startedAt) < 0) {
    throw new InvalidDateError('reading date cannot be before the cycle start date.');
  }

  if (cycle.status === 'completed' && cycle.finishedAt) {
    assertValidIsoDate(cycle.finishedAt, 'cycle finish date');

    if (compareIsoDates(readingDate, cycle.finishedAt) > 0) {
      throw new InvalidDateError('reading date cannot be after the cycle finish date.');
    }
  }

  if (cycle.status === 'dropped' && cycle.droppedAt) {
    assertValidIsoDate(cycle.droppedAt, 'cycle drop date');

    if (compareIsoDates(readingDate, cycle.droppedAt) > 0) {
      throw new InvalidDateError('reading date cannot be after the cycle drop date.');
    }
  }
}

