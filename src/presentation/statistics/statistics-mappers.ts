import type {
  AuthorReadingStatistics,
  BookReadingStatistics,
  FormatReadingStatistics,
  PeriodBucket,
  PeriodReadingStatistics,
} from '@/src/application';
import { i18n } from '@/src/localization/i18n';

import {
  formatAuthors,
  formatCivilDate,
  formatDecimal,
  formatDuration,
  formatInteger,
  formatMonthLabel,
  formatPercentage,
} from './statistics-formatters';
import type {
  AuthorStatisticsViewModel,
  BookStatisticsSortKey,
  BookStatisticsViewModel,
  ChartPointViewModel,
  FormatStatisticsViewModel,
  StatisticMetricViewModel,
  StatisticsOverviewViewModel,
  StatisticsPeriodViewModel,
} from './statistics-types';

export function mapStatisticsOverview(
  period: StatisticsPeriodViewModel,
  statistics: PeriodReadingStatistics,
  books: BookReadingStatistics[],
  authors: AuthorReadingStatistics[],
  formats: FormatReadingStatistics[],
  bookSort: BookStatisticsSortKey,
): StatisticsOverviewViewModel {
  return {
    period,
    hasReadingData: statistics.totalLogs > 0 || statistics.totalCompletedCycles > 0,
    summary: mapSummaryMetrics(statistics),
    streak: [
      { label: t('statistics.metrics.currentStreak'), value: t('statistics.formatters.streakDay', { count: statistics.currentStreak }) },
      { label: t('statistics.metrics.longestStreak'), value: t('statistics.formatters.streakDay', { count: statistics.longestStreak }) },
    ],
    pagesByDay: statistics.daily.map((bucket) => mapBucket(bucket, formatCivilDate, 'pages')),
    readingTimeByDay: statistics.daily.map((bucket) => mapBucket(bucket, formatCivilDate, 'duration')),
    pagesByMonth: statistics.monthly.map((bucket) => mapBucket(bucket, formatMonthLabel, 'pages')),
    books: sortBookStatistics(books.map(mapBookStatistics), bookSort),
    authors: authors.map(mapAuthorStatistics).sort((left, right) => left.name.localeCompare(right.name)),
    formats: mapFormatStatistics(formats),
  };
}

export function mapSummaryMetrics(statistics: PeriodReadingStatistics): StatisticMetricViewModel[] {
  return [
    { label: t('statistics.metrics.totalPagesRead'), value: formatInteger(statistics.totalPagesRead) },
    { label: t('statistics.metrics.totalReadingTime'), value: formatDuration(statistics.totalDurationSeconds) },
    { label: t('statistics.metrics.readingDays'), value: formatInteger(statistics.totalReadingDays) },
    { label: t('statistics.metrics.completedBooks'), value: formatInteger(statistics.totalCompletedWorks) },
    { label: t('statistics.metrics.completedCycles'), value: formatInteger(statistics.totalCompletedCycles) },
    { label: t('statistics.metrics.rereads'), value: formatInteger(statistics.totalRereads) },
    { label: t('statistics.metrics.averagePagesPerReadingDay'), value: formatDecimal(statistics.averagePagesPerReadingDay) },
    { label: t('statistics.metrics.averagePagesPerLog'), value: formatDecimal(statistics.averagePagesPerLog) },
  ];
}

export function mapBookStatistics(statistics: BookReadingStatistics): BookStatisticsViewModel {
  return {
    id: statistics.libraryBook.id,
    title: statistics.work.title,
    authors: formatAuthors(statistics.authors.map((author) => author.name)),
    completedCycles: statistics.completedCycles,
    completedCyclesLabel: t('statistics.formatters.completedCycle', { count: statistics.completedCycles }),
    rereads: statistics.rereadCount,
    rereadsLabel: t('statistics.formatters.reread', { count: statistics.rereadCount }),
    pagesRead: statistics.totalPagesRead,
    pagesReadLabel: t('statistics.formatters.page', { count: statistics.totalPagesRead }),
    readingTime: statistics.totalDurationSeconds,
    readingTimeLabel: formatDuration(statistics.totalDurationSeconds),
    readingDays: statistics.readingDays,
    readingDaysLabel: t('statistics.formatters.readingDay', { count: statistics.readingDays }),
    averagePagesPerDay: statistics.averagePagesPerDay,
    averagePagesPerDayLabel: t('statistics.formatters.averagePagesPerDay', {
      value: formatDecimal(statistics.averagePagesPerDay),
    }),
  };
}

export function mapAuthorStatistics(statistics: AuthorReadingStatistics): AuthorStatisticsViewModel {
  return {
    id: statistics.author.id,
    name: statistics.author.name,
    worksReadLabel: t('statistics.formatters.work', { count: statistics.worksRead }),
    completedCyclesLabel: t('statistics.formatters.completedCycle', { count: statistics.completedCycles }),
    pagesReadLabel: t('statistics.formatters.page', { count: statistics.pagesRead }),
    readingTimeLabel: formatDuration(statistics.durationSeconds),
    averageRatingLabel: statistics.averageRating == null ? t('statistics.formatters.noRating') : `${formatDecimal(statistics.averageRating)} / 5`,
    rereadsLabel: t('statistics.formatters.reread', { count: statistics.rereads }),
  };
}

export function mapFormatStatistics(statistics: FormatReadingStatistics[]): FormatStatisticsViewModel[] {
  const totalPages = statistics.reduce((total, item) => total + item.pagesRead, 0);

  return statistics.map((item) => ({
    id: item.format,
    label: formatFormatLabel(item.format),
    pagesRead: item.pagesRead,
    pagesReadLabel: t('statistics.formatters.page', { count: item.pagesRead }),
    readingTimeLabel: formatDuration(item.durationSeconds),
    completedCyclesLabel: t('statistics.formatters.completedCycle', { count: item.completedCycles }),
    percentage: totalPages === 0 ? 0 : (item.pagesRead / totalPages) * 100,
    percentageLabel: totalPages === 0 ? '0%' : formatPercentage((item.pagesRead / totalPages) * 100),
  }));
}

export function sortBookStatistics(
  books: BookStatisticsViewModel[],
  sort: BookStatisticsSortKey,
): BookStatisticsViewModel[] {
  return [...books].sort((left, right) => {
    if (sort === 'title') return left.title.localeCompare(right.title);
    if (sort === 'time') return right.readingTime - left.readingTime || left.title.localeCompare(right.title);
    if (sort === 'completedCycles') return right.completedCycles - left.completedCycles || left.title.localeCompare(right.title);
    return right.pagesRead - left.pagesRead || left.title.localeCompare(right.title);
  });
}

function mapBucket(
  bucket: PeriodBucket,
  labelFormatter: (key: string) => string,
  valueKind: 'pages' | 'duration',
): ChartPointViewModel {
  const value = valueKind === 'pages' ? bucket.pagesRead : bucket.durationSeconds;

  return {
    key: bucket.key,
    label: labelFormatter(bucket.key),
    value,
    valueLabel: valueKind === 'pages' ? t('statistics.formatters.page', { count: value }) : formatDuration(value),
  };
}

function formatFormatLabel(format: FormatReadingStatistics['format']): string {
  if (format === 'physical') return t('statistics.formatters.physical');
  if (format === 'digital') return t('statistics.formatters.digital');
  return t('statistics.formatters.unknownFormat');
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
