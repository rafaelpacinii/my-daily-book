import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { Button, Card } from '@/src/components/ui';
import { appRoutes } from '@/src/presentation/navigation/routes';

export function AddBookScreen() {
  const { t } = useTranslation();

  return (
    <Screen
      header={
        <AppHeader
          title={t('library.screen.addTitle')}
          subtitle={t('library.screen.addSubtitle')}
        />
      }>
      <Card variant="elevated">
        <EmptyState
          icon="search-outline"
          title={t('library.search.googleTitle')}
          description={t('library.screen.addDescription')}
          actionLabel={t('library.screen.addAction')}
          onAction={() => router.push(appRoutes.librarySearch)}
        />
      </Card>
      <Button title={t('library.screen.addManualAction')} variant="outline" onPress={() => router.push(appRoutes.libraryManual)} />
    </Screen>
  );
}
