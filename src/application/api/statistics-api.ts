import * as queries from '@/src/application/queries/statistics';

export const statisticsApi = {
  getReadingStatistics: queries.getReadingStatistics,
  getReadingStatisticsByPeriod: queries.getReadingStatisticsByPeriod,
  getReadingStreak: queries.getReadingStreak,
  getBookReadingStatistics: queries.getBookReadingStatistics,
  listBookReadingStatistics: queries.listBookReadingStatistics,
  getAuthorReadingStatistics: queries.getAuthorReadingStatistics,
  getFormatReadingStatistics: queries.getFormatReadingStatistics,
};

export type StatisticsApi = typeof statisticsApi;
