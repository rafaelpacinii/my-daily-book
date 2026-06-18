import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  durationPartsToSeconds,
  formatDuration,
  formatPageRange,
  isValidCivilDate,
} from '../reading-formatters';

describe('reading formatters', () => {
  it('formats durations and page ranges for reading screens', () => {
    assert.equal(formatDuration(null), 'No duration');
    assert.equal(formatDuration(60), '1m');
    assert.equal(formatDuration(3900), '1h 5m');
    assert.equal(formatPageRange(10, 10), 'Page 10');
    assert.equal(formatPageRange(10, 18), 'Pages 10-18');
  });

  it('normalizes friendly duration inputs to seconds', () => {
    assert.equal(durationPartsToSeconds('', ''), null);
    assert.equal(durationPartsToSeconds('1', '30'), 5400);
    assert.equal(durationPartsToSeconds('0', '45'), 2700);
    assert.equal(durationPartsToSeconds('-1', '0'), null);
  });

  it('validates civil dates without accepting impossible calendar days', () => {
    assert.equal(isValidCivilDate('2026-06-15'), true);
    assert.equal(isValidCivilDate('2026-02-31'), false);
    assert.equal(isValidCivilDate('15/06/2026'), false);
  });
});
