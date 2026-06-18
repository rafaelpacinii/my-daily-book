import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  resolveStatisticsPeriod,
  validateCustomStatisticsPeriod,
} from '../statistics-periods';

describe('statistics periods', () => {
  it('resolves fixed periods from civil dates', () => {
    assert.deepEqual(resolveStatisticsPeriod('7d', '2026-06-15'), {
      key: '7d',
      label: '7 days',
      startDate: '2026-06-09',
      endDate: '2026-06-15',
    });
    assert.equal(resolveStatisticsPeriod('30d', '2026-06-15').startDate, '2026-05-17');
    assert.equal(resolveStatisticsPeriod('month', '2026-06-15').startDate, '2026-06-01');
    assert.equal(resolveStatisticsPeriod('year', '2026-06-15').startDate, '2026-01-01');
  });

  it('validates custom periods', () => {
    assert.equal(validateCustomStatisticsPeriod({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    }).valid, true);

    assert.equal(validateCustomStatisticsPeriod({
      startDate: '2026-06-31',
      endDate: '2026-06-30',
    }).valid, false);

    assert.equal(validateCustomStatisticsPeriod({
      startDate: '2026-07-01',
      endDate: '2026-06-30',
    }).valid, false);
  });
});

