import { useLocalSearchParams } from 'expo-router';

import { ReadingLogScreen } from '@/src/presentation/reading';

import { getSingleRouteParam } from '../../route-params';

export default function CreateReadingLogRoute() {
  const { readingCycleId } = useLocalSearchParams<{ readingCycleId?: string | string[] }>();
  const normalizedReadingCycleId = getSingleRouteParam(readingCycleId);

  return <ReadingLogScreen readingCycleId={normalizedReadingCycleId ?? ''} />;
}
