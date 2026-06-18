import { useLocalSearchParams } from 'expo-router';

import { ReadingCycleScreen } from '@/src/presentation/reading';

import { getSingleRouteParam } from '../route-params';

export default function ReadingHistoryDetailsRoute() {
  const { readingCycleId } = useLocalSearchParams<{ readingCycleId?: string | string[] }>();
  const normalizedReadingCycleId = getSingleRouteParam(readingCycleId);

  return <ReadingCycleScreen readingCycleId={normalizedReadingCycleId ?? ''} readonly />;
}
