import type { StatisticsApi } from '@/src/application';

import { mapStatisticsOverview } from './statistics-mappers';
import type {
  BookStatisticsSortKey,
  StatisticsOverviewViewModel,
  StatisticsPeriodViewModel,
} from './statistics-types';

export async function loadStatisticsOverviewViewModel(
  api: StatisticsApi,
  period: StatisticsPeriodViewModel,
  bookSort: BookStatisticsSortKey,
): Promise<StatisticsOverviewViewModel> {
  const [statistics, books, authors, formats] = await Promise.all([
    Promise.resolve(api.getReadingStatisticsByPeriod({
      startDate: period.startDate,
      endDate: period.endDate,
    })),
    Promise.resolve(api.listBookReadingStatistics()),
    Promise.resolve(api.getAuthorReadingStatistics()),
    Promise.resolve(api.getFormatReadingStatistics()),
  ]);

  return mapStatisticsOverview(period, statistics, books, authors, formats, bookSort);
}
