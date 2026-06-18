import { useLocalSearchParams } from 'expo-router';

import { ReadingGoalDetailsScreen } from '@/src/presentation/goals';

import { getSingleRouteParam } from './route-params';

export default function ReadingGoalDetailsRoute() {
  const { readingGoalId } = useLocalSearchParams<{ readingGoalId?: string | string[] }>();
  return <ReadingGoalDetailsScreen readingGoalId={getSingleRouteParam(readingGoalId) ?? ''} />;
}

