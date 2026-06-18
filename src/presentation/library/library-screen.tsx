import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import {
  appRoutes,
  libraryBookRoute,
} from '@/src/presentation/navigation/routes';

import {
  LibraryBookCard,
  LibraryEmptyState,
  LibraryFilterBar,
  LibraryLoadingState,
  LibrarySearchInput,
  PaginatedListFooter,
} from './components';
import {
  hasActiveLibraryFilters,
  useLibraryScreen,
} from './library-controller';
import type { LibraryBookViewModel } from './library-types';

export function LibraryScreen() {
  const { api } = useApplication();

  if (!api) {
    return (
      <Screen>
        <LibraryLoadingState />
      </Screen>
    );
  }

  return <LibraryScreenContent api={api} />;
}

function LibraryScreenContent({
  api,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useLibraryScreen(api);
  const isInitialLoading = state.status === 'idle' || (state.status === 'loading' && state.items.length === 0);
  const isFiltering = hasActiveLibraryFilters(state.debouncedQuery, state.filters);

  if (isInitialLoading) {
    return (
      <Screen>
        <LibraryLoadingState />
      </Screen>
    );
  }

  if (state.status === 'error' && state.items.length === 0) {
    return (
      <Screen
        header={
          <AppHeader
            title={t('tabs.library')}
            subtitle={t('library.search.subtitle')}
            rightAction={<Button title={t('common.actions.add')} variant="ghost" onPress={() => router.push(appRoutes.libraryAdd)} />}
          />
        }>
        <ErrorState
          title={t('library.search.errorTitle')}
          description={t('errors.generic')}
          actionLabel={t('common.actions.retry')}
          onAction={state.retry}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={state.items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={state.refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.lg }}>
            <AppHeader
              title={t('tabs.library')}
              subtitle={t('library.search.subtitle')}
              rightAction={
                <Button
                  title={t('common.actions.add')}
                  variant="ghost"
                  accessibilityLabel={t('common.actions.add')}
                  onPress={() => router.push(appRoutes.libraryAdd)}
                />
              }
            />
            <LibrarySearchInput
              value={state.query}
              onChangeText={state.setQuery}
              onClear={() => state.setQuery('')}
            />
            <LibraryFilterBar
              filters={state.filters}
              sort={state.sort}
              onStatusChange={state.setStatusFilter}
              onOwnershipChange={state.setOwnershipFilter}
              onFormatChange={state.setFormatFilter}
              onSortChange={state.setSort}
            />
            <SectionHeader
              title={t('tabs.library')}
              description={`${state.total} ${state.total === 1 ? 'result' : 'results'}`}
            />
            {state.error ? (
              <ErrorState
                title={t('library.search.errorTitle')}
                description={t('errors.generic')}
                actionLabel={t('common.actions.retry')}
                onAction={state.refresh}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <LibraryEmptyState
            searching={isFiltering}
            onPrimaryAction={
              isFiltering
                ? state.clearQueryAndFilters
                : () => router.push(appRoutes.libraryAdd)
            }
          />
        }
        renderItem={({ item }: { item: LibraryBookViewModel }) => (
          <LibraryBookCard
            book={item}
            onPress={() => router.push(libraryBookRoute(item.id))}
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
      <AppText style={styles.hidden} color="textSecondary">
        Library list
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    maxWidth: 720,
    width: '100%',
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
});
