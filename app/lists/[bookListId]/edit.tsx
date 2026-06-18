import { useLocalSearchParams } from 'expo-router';

import { BookListFormScreen } from '@/src/presentation/lists';

import { getSingleRouteParam } from '../route-params';

export default function EditBookListRoute() {
  const { bookListId } = useLocalSearchParams<{ bookListId?: string | string[] }>();
  return <BookListFormScreen bookListId={getSingleRouteParam(bookListId) ?? ''} />;
}
