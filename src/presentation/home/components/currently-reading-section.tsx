import { View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/src/components/feedback';
import { SectionHeader } from '@/src/components/layout';
import { Button, Card } from '@/src/components/ui';
import { appRoutes } from '@/src/presentation/navigation/routes';

import type { CurrentlyReadingBookViewModel } from '../home-types';
import { CurrentlyReadingCard } from './currently-reading-card';

export interface CurrentlyReadingSectionProps {
  books: CurrentlyReadingBookViewModel[];
}

export function CurrentlyReadingSection({ books }: CurrentlyReadingSectionProps) {
  return (
    <View>
      <SectionHeader
        title="Currently reading"
        action={<Button title="Browse library" variant="ghost" onPress={() => router.push(appRoutes.library)} />}
      />
      {books.length === 0 ? (
        <Card variant="outlined">
          <EmptyState
            icon="book-outline"
            title="No book currently being read"
            description="Books with active reading cycles will appear here."
            actionLabel="Browse library"
            onAction={() => router.push(appRoutes.library)}
          />
        </Card>
      ) : (
        books.map((book) => <CurrentlyReadingCard key={book.id} book={book} />)
      )}
    </View>
  );
}
