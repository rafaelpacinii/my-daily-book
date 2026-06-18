import { useLocalSearchParams } from 'expo-router';

import { ReadingLogScreen } from '@/src/presentation/reading';

import { getSingleRouteParam } from '../../route-params';

export default function EditReadingLogRoute() {
  const { readingLogId } = useLocalSearchParams<{ readingLogId?: string | string[] }>();
  const normalizedReadingLogId = getSingleRouteParam(readingLogId);

  return <ReadingLogScreen readingLogId={normalizedReadingLogId ?? ''} />;
}
