import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { appRoutes, bookListRoute } from '@/src/presentation/navigation/routes';

import { useListsScreen } from './lists-controller';
import type { BookListSummaryViewModel } from './lists-types';

export function ListsScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('lists.screen.loading')} />;
  return <ListsScreenContent api={api} />;
}

function ListsScreenContent({ api }: { api: NonNullable<ReturnType<typeof useApplication>['api']> }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useListsScreen(api);
  const loading = state.status === 'idle' || (state.status === 'loading' && !state.viewModel);

  if (loading) return <Screen loading loadingMessage={t('lists.screen.loading')} />;

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<Header />}>
        <ErrorState
          title={t('lists.screen.loadErrorTitle')}
          description={t('errors.generic')}
          actionLabel={t('common.actions.retry')}
          onAction={state.retry}
        />
      </Screen>
    );
  }

  const viewModel = state.viewModel;
  if (!viewModel) return <Screen loading loadingMessage={t('lists.screen.loading')} />;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      header={<Header />}>
      {state.error ? (
        <ErrorState
          title={t('lists.screen.refreshErrorTitle')}
          description={t('lists.screen.refreshErrorDescription')}
          actionLabel={t('common.actions.retry')}
          onAction={state.refresh}
        />
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('lists.screen.wishlistTitle')} />
        <Card
          variant="interactive"
          accessibilityLabel={t('lists.screen.openWishlist')}
          onPress={() => router.push(appRoutes.wishlist)}>
          <AppText variant="heading3">{viewModel.wishlist.name}</AppText>
          <AppText color="textSecondary">{viewModel.wishlist.itemCountLabel}</AppText>
          <AppText color="textSecondary">
            {viewModel.wishlist.description ?? t('lists.screen.wishlistDescriptionFallback')}
          </AppText>
        </Card>
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('lists.screen.goalsSectionTitle')} />
        <Card variant="interactive" accessibilityLabel={t('goals.screen.title')} onPress={() => router.push(appRoutes.goals)}>
          <AppText variant="heading3">{t('lists.screen.goalsCardTitle')}</AppText>
          <AppText color="textSecondary">{t('lists.screen.goalsCardDescription')}</AppText>
        </Card>
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title={t('lists.screen.customListsTitle')}
          description={t('lists.screen.customListsCount', { count: viewModel.customLists.length })}
        />
        {viewModel.customLists.length > 0 ? (
          viewModel.customLists.map((list) => (
            <BookListSummaryCard key={list.id} list={list} onPress={() => router.push(bookListRoute(list.id))} />
          ))
        ) : (
          <Card variant="outlined">
            <EmptyState
              icon="list-outline"
              title={t('lists.screen.emptyTitle')}
              description={t('lists.screen.emptyDescription')}
              actionLabel={t('lists.form.createAction')}
              onAction={() => router.push(appRoutes.listsCreate)}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <AppHeader
      title={t('lists.screen.headerTitle')}
      subtitle={t('lists.screen.headerSubtitle')}
      rightAction={<Button title={t('lists.screen.new')} variant="ghost" onPress={() => router.push(appRoutes.listsCreate)} />}
    />
  );
}

function BookListSummaryCard({ list, onPress }: { list: BookListSummaryViewModel; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Card variant="interactive" accessibilityLabel={t('lists.screen.openList', { name: list.name })} onPress={onPress}>
      <AppText variant="heading3">{list.name}</AppText>
      {list.description ? <AppText color="textSecondary">{list.description}</AppText> : null}
      <AppText color="textSecondary">{list.itemCountLabel} - {list.updatedAtLabel}</AppText>
    </Card>
  );
}
