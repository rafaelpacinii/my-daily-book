import { useLocalSearchParams } from 'expo-router';

import { WishlistItemScreen } from '@/src/presentation/lists';

import { getSingleRouteParam } from '../../lists/route-params';

export default function WishlistItemRoute() {
  const { bookListItemId } = useLocalSearchParams<{ bookListItemId?: string | string[] }>();
  return <WishlistItemScreen bookListItemId={getSingleRouteParam(bookListItemId) ?? ''} />;
}
