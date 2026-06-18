import { useLocalSearchParams } from 'expo-router';

import { GoogleBookDetailsScreen } from '@/src/presentation/library/add';
import type { BookMetadataSource } from '@/src/application';

export default function GoogleBookRoute() {
  const { volumeId, source } = useLocalSearchParams<{
    volumeId?: string | string[];
    source?: BookMetadataSource | BookMetadataSource[];
  }>();
  const normalizedSource = source === 'brasil_api' ? 'brasil_api' : 'google_books';

  return <GoogleBookDetailsScreen
    volumeId={typeof volumeId === 'string' ? volumeId : ''}
    source={normalizedSource}
  />;
}
