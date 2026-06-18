import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FutureReadingDateError,
  InvalidDateError,
  compareIsoDates,
  isFutureDate,
  isPastDate,
  isSameDate,
  isValidIsoDate,
  validateReadingDate,
} from '@/src/domain';

describe('civil dates', () => {
  it('validates ISO dates without UTC parsing', () => {
    assert.equal(isValidIsoDate('2026-06-14'), true);
    assert.equal(isValidIsoDate('2026-02-29'), false);
    assert.equal(isValidIsoDate('2024-02-29'), true);
    assert.equal(isValidIsoDate('14/06/2026'), false);
  });

  it('compares ISO dates by calendar components', () => {
    assert.equal(compareIsoDates('2026-06-13', '2026-06-14'), -1);
    assert.equal(isPastDate('2026-06-13', '2026-06-14'), true);
    assert.equal(isFutureDate('2026-06-15', '2026-06-14'), true);
    assert.equal(isSameDate('2026-06-14', '2026-06-14'), true);
  });

  it('allows today and past reading dates', () => {
    assert.doesNotThrow(() => validateReadingDate('2026-06-14', '2026-06-14'));
    assert.doesNotThrow(() => validateReadingDate('2026-06-13', '2026-06-14'));
  });

  it('rejects future reading dates and dates outside cycle bounds', () => {
    assert.throws(() => validateReadingDate('2026-06-15', '2026-06-14'), FutureReadingDateError);
    assert.throws(
      () => validateReadingDate('2026-06-01', '2026-06-14', {
        startedAt: '2026-06-02',
        status: 'reading',
      }),
      InvalidDateError,
    );
    assert.throws(
      () => validateReadingDate('2026-06-15', '2026-06-16', {
        startedAt: '2026-06-01',
        status: 'completed',
        finishedAt: '2026-06-14',
      }),
      InvalidDateError,
    );
    assert.throws(
      () => validateReadingDate('2026-06-15', '2026-06-16', {
        startedAt: '2026-06-01',
        status: 'dropped',
        droppedAt: '2026-06-14',
      }),
      InvalidDateError,
    );
  });
});

