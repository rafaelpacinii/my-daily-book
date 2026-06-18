import { useLocalSearchParams } from 'expo-router';

import { LibraryBookDetailsScreen } from '@/src/presentation/library/details';

export default function LibraryBookRoute() {
  const { libraryBookId } = useLocalSearchParams<{ libraryBookId: string }>();

  return <LibraryBookDetailsScreen libraryBookId={libraryBookId} />;
}
