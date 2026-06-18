import type { ApplicationApi } from '@/src/application';

import { toLocalCivilDate } from './reading-formatters';
import {
  mapActiveReading,
  mapDailyReadingSummary,
  mapReadingHistoryItem,
} from './reading-mappers';
import type { ReadingHomeViewModel } from './reading-types';

export async function loadReadingHomeViewModel(
  api: ApplicationApi,
  today = toLocalCivilDate(),
): Promise<ReadingHomeViewModel> {
  const [activeCycles, dailySummary, recentHistory] = await Promise.all([
    Promise.resolve(api.reading.listActiveCycles()),
    Promise.resolve(api.reading.getDailySummary(today)),
    Promise.resolve(api.reading.listHistory({
      limit: 3,
      orderBy: 'lastReadAt',
      orderDirection: 'desc',
    })),
  ]);

  return {
    activeCycles: activeCycles.map(mapActiveReading),
    dailySummary: mapDailyReadingSummary(dailySummary),
    recentHistory: recentHistory.items.map(mapReadingHistoryItem),
  };
}
