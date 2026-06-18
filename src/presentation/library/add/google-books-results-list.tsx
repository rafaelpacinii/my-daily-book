import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { Button } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { appRoutes, externalBookMetadataRoute } from '@/src/presentation/navigation/routes';

import { PaginatedListFooter } from '../components';
import { GoogleBooksSearchForm } from './google-books-search-form';
import { GoogleBooksResultCard } from './google-books-result-card';
import { useGoogleBooksSearch } from './google-books-search-controller';

export function GoogleBooksSearchScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) return <Screen loading loadingMessage={t('library.search.loading')} />;

  return <GoogleBooksSearchContent api={api} />;
}

function GoogleBooksSearchContent({
  api,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useGoogleBooksSearch(api);

  return (
    <Screen scroll={false}>
      <FlatList
        data={state.items}
        keyExtractor={(item) => `${item.source}:${item.externalId}`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignSelf: 'center',
          width: '100%',
          maxWidth: 720,
          gap: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.lg }}>
            <AppHeader
              title={t('library.search.googleTitle')}
              subtitle={t('library.search.subtitle')}
            />
            <GoogleBooksSearchForm
              query={state.query}
              loading={state.status === 'loading'}
              onQueryChange={state.setQuery}
              onSubmit={state.submit}
            />
            <Button
              title={t('library.screen.addManualAction')}
              variant="outline"
              onPress={() => router.push(appRoutes.libraryManual)}
            />
            {state.status === 'error' ? (
              <ErrorState
                title={isIsbnSearch(state.query) ? t('library.search.isbnErrorTitle') : t('library.search.errorTitle')}
                description={mapSearchErrorDescription(state.error, t)}
                actionLabel={t('common.actions.retry')}
                onAction={state.retry}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          state.status === 'success' ? (
            <EmptyState
              icon="search-outline"
              title={isIsbnSearch(state.query) ? t('library.search.isbnNotFound') : t('library.search.emptyTitle')}
              description={t('library.search.emptyDescription')}
              actionLabel={t('library.screen.addManualAction')}
              onAction={() => router.push(appRoutes.libraryManual)}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <GoogleBooksResultCard
            result={item}
            onPress={() => router.push(externalBookMetadataRoute({
              source: item.source,
              externalId: item.externalId,
            }))}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListFooterComponent={
          <PaginatedListFooter
            loading={state.loadingMore}
            error={state.loadMoreError}
            hasMore={state.hasMore}
            onRetry={state.loadMore}
          />
        }
        onEndReachedThreshold={0.35}
        onEndReached={state.loadMore}
      />
    </Screen>
  );
}

function mapSearchErrorDescription(error: unknown, t: (key: string) => string): string {
  if (
    error instanceof Error &&
    ['BrasilApiUnavailableError', 'BrasilApiRateLimitError'].includes(error.name)
  ) {
    return t('library.search.brasilApiUnavailable');
  }

  return t('errors.generic');
}

function isIsbnSearch(query: string): boolean {
  const normalized = query.replace(/[\s-]/g, '').toUpperCase();

  return normalized.length === 10 || normalized.length === 13;
}
