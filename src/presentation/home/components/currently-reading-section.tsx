import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <View>
      <SectionHeader
        title={t('home.currentlyReading.title')}
        action={<Button title={t('home.currentlyReading.browseLibrary')} variant="ghost" onPress={() => router.push(appRoutes.library)} />}
      />
      {books.length === 0 ? (
        <Card variant="outlined">
          <EmptyState
            icon="book-outline"
            title={t('home.currentlyReading.emptyTitle')}
            description={t('home.currentlyReading.emptyDescription')}
            actionLabel={t('home.currentlyReading.browseLibrary')}
            onAction={() => router.push(appRoutes.library)}
          />
        </Card>
      ) : (
        books.map((book) => <CurrentlyReadingCard key={book.id} book={book} />)
      )}
    </View>
  );
}
