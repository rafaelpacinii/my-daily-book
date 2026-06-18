import { useLocalSearchParams } from 'expo-router';

import { AddListItemScreen } from '@/src/presentation/lists';

import { getSingleRouteParam } from '../route-params';

export default function AddBookToListRoute() {
  const { bookListId } = useLocalSearchParams<{ bookListId?: string | string[] }>();
  return <AddListItemScreen bookListId={getSingleRouteParam(bookListId) ?? ''} />;
}
