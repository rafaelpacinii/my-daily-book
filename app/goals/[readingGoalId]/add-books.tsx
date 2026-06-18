import { useLocalSearchParams } from 'expo-router';

import { AddReadingGoalBooksScreen } from '@/src/presentation/goals';

import { getSingleRouteParam } from '../route-params';

export default function AddReadingGoalBooksRoute() {
  const { readingGoalId } = useLocalSearchParams<{ readingGoalId?: string | string[] }>();
  return <AddReadingGoalBooksScreen readingGoalId={getSingleRouteParam(readingGoalId) ?? ''} />;
}

