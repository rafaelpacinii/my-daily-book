import { useLocalSearchParams } from 'expo-router';

import { BookListDetailsScreen } from '@/src/presentation/lists';

import { getSingleRouteParam } from './route-params';

export default function BookListDetailsRoute() {
  const { bookListId } = useLocalSearchParams<{ bookListId?: string | string[] }>();
  return <BookListDetailsScreen bookListId={getSingleRouteParam(bookListId) ?? ''} />;
}
