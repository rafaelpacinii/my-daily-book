import { ValidationError } from '../../errors';
import type { ReadingContinuityResult, ReadingPageRange } from '../types';

export function checkReadingContinuity(
  previousLog: ReadingPageRange | null,
  startPage: number,
): ReadingContinuityResult {
  const expectedStartPage = previousLog ? previousLog.endPage + 1 : null;

  return {
    expectedStartPage,
    isContinuous: expectedStartPage == null || startPage === expectedStartPage,
  };
}

export function assertReadingContinuity(
  result: ReadingContinuityResult,
  allowDiscontinuousPages?: boolean,
): void {
  if (!result.isContinuous && !allowDiscontinuousPages) {
    throw new ValidationError('reading pages are discontinuous and require explicit confirmation.');
  }
}

export function hasOverlappingPages(
  existingLogs: ReadingPageRange[],
  newRange: ReadingPageRange,
): boolean {
  return existingLogs.some(
    (log) => newRange.startPage <= log.endPage && newRange.endPage >= log.startPage,
  );
}

export function assertNoOverlappingPages(
  existingLogs: ReadingPageRange[],
  newRange: ReadingPageRange,
  allowOverlappingPages?: boolean,
): void {
  if (hasOverlappingPages(existingLogs, newRange) && !allowOverlappingPages) {
    throw new ValidationError('reading pages overlap an existing log and require confirmation.');
  }
}

