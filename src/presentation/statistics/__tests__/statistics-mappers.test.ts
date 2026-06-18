import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  AuthorReadingStatistics,
  BookReadingStatistics,
  FormatReadingStatistics,
  PeriodReadingStatistics,
} from '@/src/application';
import { i18n } from '@/src/localization/i18n';

import {
  formatDuration,
  formatPercentage,
} from '../statistics-formatters';
import {
  mapFormatStatistics,
  mapStatisticsOverview,
  sortBookStatistics,
} from '../statistics-mappers';

describe('statistics mappers', () => {
  it('formats duration and percentage without noisy decimals', () => {
    assert.equal(formatDuration(0), '0 min');
    assert.equal(formatDuration(90), '2 min');
    assert.equal(formatDuration(3900), '1h 5m');
    assert.equal(formatPercentage(33.3333), '33.3%');
  });

  it('maps overview metrics and chart points including zero gaps', () => {
    const viewModel = mapStatisticsOverview(
      { key: 'custom', label: 'Custom', startDate: '2026-06-01', endDate: '2026-06-03' },
      periodStatistics(),
      [bookStatistics('book-1', 'Book One', 120, 3600, 2)],
      [authorStatistics()],
      formatStatistics(),
      'pages',
    );

    assert.equal(viewModel.hasReadingData, true);
    assert.equal(viewModel.summary.find((item) => item.label === 'Total pages read')?.value, '120');
    assert.equal(viewModel.pagesByDay[1]?.value, 0);
    assert.equal(viewModel.readingTimeByDay[0]?.valueLabel, '30 min');
    assert.equal(viewModel.pagesByMonth[0]?.label, 'Jun 2026');
  });

  it('sorts book statistics by supported fields', () => {
    const books = [
      bookStatistics('book-1', 'Alpha', 100, 100, 1),
      bookStatistics('book-2', 'Beta', 300, 50, 3),
    ].map((item) => mapStatisticsOverview(
      { key: 'all', label: 'All time', startDate: '0001-01-01', endDate: '2026-06-15' },
      periodStatistics(),
      [item],
      [],
      formatStatistics(),
      'pages',
    ).books[0]).filter((item): item is NonNullable<typeof item> => item != null);

    assert.equal(sortBookStatistics(books, 'pages')[0]?.title, 'Beta');
    assert.equal(sortBookStatistics(books, 'time')[0]?.title, 'Alpha');
    assert.equal(sortBookStatistics(books, 'completedCycles')[0]?.title, 'Beta');
    assert.equal(sortBookStatistics(books, 'title')[0]?.title, 'Alpha');
  });

  it('maps format percentages with a zero-total fallback', () => {
    const formats = mapFormatStatistics(formatStatistics());
    const empty = mapFormatStatistics([
      { format: 'physical', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
      { format: 'digital', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
      { format: 'unknown', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
    ]);

    assert.equal(formats[0]?.percentageLabel, '75%');
    assert.equal(formats[2]?.label, 'Unknown');
    assert.equal(empty[0]?.percentageLabel, '0%');
  });

  it('localizes mapper labels in pt-BR', async () => {
    await i18n.changeLanguage('pt-BR');

    try {
      const viewModel = mapStatisticsOverview(
        { key: 'custom', label: 'Personalizado', startDate: '2026-06-01', endDate: '2026-06-03' },
        periodStatistics(),
        [bookStatistics('book-1', 'Book One', 120, 3600, 2)],
        [authorStatistics()],
        formatStatistics(),
        'pages',
      );

      assert.equal(viewModel.summary[0]?.label, 'Total de páginas lidas');
      assert.equal(viewModel.streak[0]?.label, 'Sequência atual');
      assert.equal(viewModel.books[0]?.pagesReadLabel, '120 páginas');
      assert.equal(viewModel.formats[0]?.label, 'Físico');
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});

function periodStatistics(): PeriodReadingStatistics {
  return {
    totalPagesRead: 120,
    totalDurationSeconds: 5400,
    totalLogs: 2,
    totalReadingDays: 2,
    totalCompletedCycles: 1,
    totalRereads: 0,
    totalCompletedWorks: 1,
    averagePagesPerReadingDay: 60,
    averagePagesPerLog: 60,
    averageDurationPerReadingDay: 2700,
    currentStreak: 2,
    longestStreak: 5,
    mostPagesInOneDay: 80,
    mostTimeInOneDay: 3600,
    daily: [
      { key: '2026-06-01', pagesRead: 80, durationSeconds: 1800, logCount: 1 },
      { key: '2026-06-02', pagesRead: 0, durationSeconds: 0, logCount: 0 },
      { key: '2026-06-03', pagesRead: 40, durationSeconds: 3600, logCount: 1 },
    ],
    weekly: [],
    monthly: [{ key: '2026-06', pagesRead: 120, durationSeconds: 5400, logCount: 2 }],
  };
}

function bookStatistics(
  id: string,
  title: string,
  pages: number,
  duration: number,
  completedCycles: number,
): BookReadingStatistics {
  return {
    libraryBook: {
      id,
      workId: `work-${id}`,
      status: 'read',
      rating: null,
      notes: null,
      addedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    work: {
      id: `work-${id}`,
      title,
      originalTitle: null,
      description: null,
      originalLanguage: null,
      firstPublishedDate: null,
      createdAt: 1,
      updatedAt: 1,
    },
    authors: [{ id: 'author-1', name: 'Author One', createdAt: 1, updatedAt: 1 }],
    totalCycles: completedCycles,
    completedCycles,
    droppedCycles: 0,
    rereadCount: Math.max(0, completedCycles - 1),
    totalPagesRead: pages,
    totalDurationSeconds: duration,
    readingDays: 2,
    firstStartedAt: '2026-06-01',
    latestFinishedAt: '2026-06-03',
    averagePagesPerDay: pages / 2,
    averageDurationPerDay: duration / 2,
  };
}

function authorStatistics(): AuthorReadingStatistics {
  return {
    author: { id: 'author-1', name: 'Author One', createdAt: 1, updatedAt: 1 },
    worksRead: 1,
    completedCycles: 1,
    pagesRead: 120,
    durationSeconds: 5400,
    averageRating: null,
    rereads: 0,
  };
}

function formatStatistics(): FormatReadingStatistics[] {
  return [
    { format: 'physical', completedCycles: 1, pagesRead: 90, durationSeconds: 3600 },
    { format: 'digital', completedCycles: 0, pagesRead: 30, durationSeconds: 1800 },
    { format: 'unknown', completedCycles: 0, pagesRead: 0, durationSeconds: 0 },
  ];
}
