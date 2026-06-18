import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  AuthorReadingStatistics,
  BookReadingStatistics,
  FormatReadingStatistics,
  PeriodReadingStatistics,
  StatisticsApi,
} from '@/src/application';

import { loadStatisticsOverviewViewModel } from '../statistics-loader';

describe('statistics loader', () => {
  it('loads overview through the public statistics API', async () => {
    const api = createApi();
    const viewModel = await loadStatisticsOverviewViewModel(api, {
      key: '30d',
      label: '30 days',
      startDate: '2026-05-17',
      endDate: '2026-06-15',
    }, 'pages');

    assert.deepEqual(calls, [
      'getReadingStatisticsByPeriod',
      'listBookReadingStatistics',
      'getAuthorReadingStatistics',
      'getFormatReadingStatistics',
    ]);
    assert.equal(viewModel.summary[0]?.value, '10');
    assert.equal(viewModel.books[0]?.title, 'Book One');
  });

  it('propagates loading errors for retry state', async () => {
    const error = new Error('boom');
    const api = createApi({
      getReadingStatisticsByPeriod: () => {
        throw error;
      },
    });

    await assert.rejects(() => loadStatisticsOverviewViewModel(api, {
      key: '30d',
      label: '30 days',
      startDate: '2026-05-17',
      endDate: '2026-06-15',
    }, 'pages'), error);
  });
});

let calls: string[] = [];

function createApi(overrides: Partial<StatisticsApi> = {}): StatisticsApi {
  calls = [];

  return {
    getReadingStatistics: () => statistics(),
    getReadingStatisticsByPeriod: () => {
      calls.push('getReadingStatisticsByPeriod');
      return statistics();
    },
    getReadingStreak: () => ({ currentStreak: 0, longestStreak: 0, latestReadingDate: null }),
    getBookReadingStatistics: () => book(),
    listBookReadingStatistics: () => {
      calls.push('listBookReadingStatistics');
      return [book()];
    },
    getAuthorReadingStatistics: () => {
      calls.push('getAuthorReadingStatistics');
      return [author()];
    },
    getFormatReadingStatistics: () => {
      calls.push('getFormatReadingStatistics');
      return formats();
    },
    ...overrides,
  };
}

function statistics(): PeriodReadingStatistics {
  return {
    totalPagesRead: 10,
    totalDurationSeconds: 600,
    totalLogs: 1,
    totalReadingDays: 1,
    totalCompletedCycles: 1,
    totalRereads: 0,
    totalCompletedWorks: 1,
    averagePagesPerReadingDay: 10,
    averagePagesPerLog: 10,
    averageDurationPerReadingDay: 600,
    currentStreak: 1,
    longestStreak: 1,
    mostPagesInOneDay: 10,
    mostTimeInOneDay: 600,
    daily: [{ key: '2026-06-15', pagesRead: 10, durationSeconds: 600, logCount: 1 }],
    weekly: [],
    monthly: [{ key: '2026-06', pagesRead: 10, durationSeconds: 600, logCount: 1 }],
  };
}

function book(): BookReadingStatistics {
  return {
    libraryBook: {
      id: 'book-1',
      workId: 'work-1',
      status: 'read',
      rating: null,
      notes: null,
      addedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    work: {
      id: 'work-1',
      title: 'Book One',
      originalTitle: null,
      description: null,
      originalLanguage: null,
      firstPublishedDate: null,
      createdAt: 1,
      updatedAt: 1,
    },
    authors: [{ id: 'author-1', name: 'Author One', createdAt: 1, updatedAt: 1 }],
    totalCycles: 1,
    completedCycles: 1,
    droppedCycles: 0,
    rereadCount: 0,
    totalPagesRead: 10,
    totalDurationSeconds: 600,
    readingDays: 1,
    firstStartedAt: '2026-06-15',
    latestFinishedAt: '2026-06-15',
    averagePagesPerDay: 10,
    averageDurationPerDay: 600,
  };
}

function author(): AuthorReadingStatistics {
  return {
    author: { id: 'author-1', name: 'Author One', createdAt: 1, updatedAt: 1 },
    worksRead: 1,
    completedCycles: 1,
    pagesRead: 10,
    durationSeconds: 600,
    averageRating: null,
    rereads: 0,
  };
}

function formats(): FormatReadingStatistics[] {
  return [
    { format: 'physical', completedCycles: 1, pagesRead: 10, durationSeconds: 600 },
    { format: 'digital', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
    { format: 'unknown', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
  ];
}
