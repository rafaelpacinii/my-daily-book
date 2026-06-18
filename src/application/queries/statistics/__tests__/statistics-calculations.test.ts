import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calculateBaseReadingStatistics,
  calculateReadingStreak,
  createPeriodBuckets,
  monthKey,
  weekKey,
} from '@/src/application/queries/statistics/statistics-calculations';
import type { ReadingCycle, ReadingLog } from '@/src/database/types';

describe('statistics calculations', () => {
  it('calculates current and longest streak from distinct reading dates', () => {
    assert.deepEqual(
      calculateReadingStreak(
        ['2026-06-10', '2026-06-10', '2026-06-12', '2026-06-13'],
        '2026-06-14',
      ),
      {
        currentStreak: 2,
        longestStreak: 2,
        latestReadingDate: '2026-06-13',
      },
    );
  });

  it('calculates inclusive pages, reading days and averages', () => {
    const logs = [
      log('l1', 'c1', '2026-06-10', 1, 10, 600),
      log('l2', 'c1', '2026-06-10', 11, 20, 300),
      log('l3', 'c2', '2026-06-11', 1, 5, null),
    ];
    const cycles = [
      cycle('c1', 'b1', 1, 'completed'),
      cycle('c2', 'b1', 2, 'completed'),
    ];
    const result = calculateBaseReadingStatistics(logs, cycles, '2026-06-12');

    assert.equal(result.totalPagesRead, 25);
    assert.equal(result.totalDurationSeconds, 900);
    assert.equal(result.totalReadingDays, 2);
    assert.equal(result.totalRereads, 1);
    assert.equal(result.averagePagesPerLog, 25 / 3);
    assert.equal(result.currentStreak, 2);
  });

  it('groups period buckets with raw keys', () => {
    const logs = [
      log('l1', 'c1', '2026-06-10', 1, 10, 600),
      log('l2', 'c1', '2026-06-12', 11, 20, 300),
    ];

    assert.deepEqual(createPeriodBuckets(logs, monthKey).map((bucket) => bucket.key), ['2026-06']);
    assert.deepEqual(createPeriodBuckets(logs, weekKey).map((bucket) => bucket.key), ['2026-06-08']);
  });
});

function log(
  id: string,
  readingCycleId: string,
  readingDate: string,
  startPage: number,
  endPage: number,
  durationSeconds: number | null,
): ReadingLog {
  return {
    id,
    readingCycleId,
    readingDate,
    startPage,
    endPage,
    durationSeconds,
    notes: null,
    createdAt: 1,
    updatedAt: 1,
  };
}

function cycle(
  id: string,
  libraryBookId: string,
  cycleNumber: number,
  status: ReadingCycle['status'],
): ReadingCycle {
  return {
    id,
    libraryBookId,
    editionId: 'e1',
    bookCopyId: null,
    cycleNumber,
    status,
    startedAt: '2026-06-10',
    finishedAt: status === 'completed' ? '2026-06-11' : null,
    droppedAt: null,
    lastReadAt: '2026-06-11',
    rating: null,
    notes: null,
    createdAt: 1,
    updatedAt: 1,
  };
}

