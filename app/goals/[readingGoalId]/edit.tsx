import { useLocalSearchParams } from 'expo-router';

import { ReadingGoalFormScreen } from '@/src/presentation/goals';

import { getSingleRouteParam } from '../route-params';

export default function EditReadingGoalRoute() {
  const { readingGoalId } = useLocalSearchParams<{ readingGoalId?: string | string[] }>();
  return <ReadingGoalFormScreen readingGoalId={getSingleRouteParam(readingGoalId) ?? ''} />;
}

