import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  InvalidPageRangeError,
  PageLimitExceededError,
  ValidationError,
  assertNoOverlappingPages,
  assertReadingContinuity,
  calculateAveragePagesPerLog,
  calculateAveragePagesPerReadingDay,
  calculatePagesRead,
  calculateReadingProgress,
  calculateTotalDuration,
  calculateTotalPagesRead,
  checkReadingContinuity,
  countReadingDays,
  determineLibraryBookStatus,
  validatePageRange,
} from '@/src/domain';

describe('reading page rules', () => {
  it('calculates inclusive page ranges', () => {
    assert.equal(calculatePagesRead(1, 53), 53);
    assert.equal(calculatePagesRead(54, 74), 21);
  });

  it('rejects invalid page ranges', () => {
    assert.throws(() => validatePageRange(0, 10), InvalidPageRangeError);
    assert.throws(() => validatePageRange(10, 9), InvalidPageRangeError);
    assert.throws(() => validatePageRange(1, 101, 100), PageLimitExceededError);
  });

  it('detects continuity gaps and overlaps while allowing explicit confirmation', () => {
    const continuity = checkReadingContinuity({ startPage: 1, endPage: 53 }, 54);
    assert.deepEqual(continuity, { isContinuous: true, expectedStartPage: 54 });

    const gap = checkReadingContinuity({ startPage: 1, endPage: 53 }, 60);
    assert.equal(gap.isContinuous, false);
    assert.throws(() => assertReadingContinuity(gap), ValidationError);
    assert.doesNotThrow(() => assertReadingContinuity(gap, true));

    assert.throws(
      () => assertNoOverlappingPages([{ startPage: 1, endPage: 53 }], { startPage: 40, endPage: 60 }),
      ValidationError,
    );
    assert.doesNotThrow(() =>
      assertNoOverlappingPages([{ startPage: 1, endPage: 53 }], { startPage: 40, endPage: 60 }, true),
    );
  });

  it('allows multiple logs on the same day at the pure-rule level', () => {
    const logs = [
      { readingDate: '2026-06-14', startPage: 1, endPage: 10 },
      { readingDate: '2026-06-14', startPage: 11, endPage: 20 },
    ];

    assert.equal(countReadingDays(logs), 1);
    assert.equal(calculateTotalPagesRead(logs), 20);
  });

  it('calculates progress and cycle stats', () => {
    const logs = [
      { readingDate: '2026-06-14', startPage: 1, endPage: 10, durationSeconds: 600 },
      { readingDate: '2026-06-15', startPage: 11, endPage: 30, durationSeconds: 900 },
    ];

    assert.equal(calculateReadingProgress(30, 100), 30);
    assert.equal(calculateReadingProgress(200, 100), 100);
    assert.equal(calculateReadingProgress(10, null), null);
    assert.equal(calculateTotalDuration(logs), 1500);
    assert.equal(calculateAveragePagesPerReadingDay(logs), 15);
    assert.equal(calculateAveragePagesPerLog(logs), 15);
  });

  it('determines summarized library book status centrally', () => {
    assert.equal(determineLibraryBookStatus([]), 'to_read');
    assert.equal(determineLibraryBookStatus([{ status: 'reading', cycleNumber: 1 }]), 'reading');
    assert.equal(determineLibraryBookStatus([{ status: 'completed', cycleNumber: 1 }]), 'read');
    assert.equal(determineLibraryBookStatus([{ status: 'dropped', cycleNumber: 1 }]), 'dropped');
    assert.equal(
      determineLibraryBookStatus([
        { status: 'completed', cycleNumber: 1 },
        { status: 'dropped', cycleNumber: 2 },
      ]),
      'read',
    );
  });
});

