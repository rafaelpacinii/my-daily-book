import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { BookCover } from '@/src/presentation/library/components';
import { appRoutes, wishlistItemRoute } from '@/src/presentation/navigation/routes';

import { useListsScreen } from './lists-controller';
import type { BookListItemViewModel } from './lists-types';

export function WishlistScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('lists.wishlist.loading')} />;
  return <WishlistContent api={api} />;
}

function WishlistContent({ api }: { api: NonNullable<ReturnType<typeof useApplication>['api']> }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useListsScreen(api);

  if (state.status === 'idle' || (state.status === 'loading' && !state.viewModel)) {
    return <Screen loading loadingMessage={t('lists.wishlist.loading')} />;
  }

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<Header />}>
        <ErrorState title={t('lists.wishlist.loadErrorTitle')} description={t('errors.generic')} actionLabel={t('common.actions.retry')} onAction={state.retry} />
      </Screen>
    );
  }

  const wishlist = state.viewModel?.wishlist;
  if (!wishlist) return <Screen loading loadingMessage={t('lists.wishlist.loading')} />;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      header={<Header />}>
      {state.error ? <ErrorState title={t('lists.wishlist.refreshErrorTitle')} description={t('lists.wishlist.refreshErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.refresh} /> : null}
      <SectionHeader title={t('lists.wishlist.title')} description={wishlist.itemCountLabel} />
      {wishlist.items.length > 0 ? wishlist.items.map((item) => (
        <WishlistItemCard key={item.id} item={item} onPress={() => router.push(wishlistItemRoute(item.id))} />
      )) : (
        <Card variant="outlined">
          <EmptyState
            icon="heart-outline"
            title={t('lists.wishlist.emptyTitle')}
            description={t('lists.wishlist.emptyDescription')}
            actionLabel={t('lists.wishlist.addItem')}
            onAction={() => router.push(appRoutes.wishlistAdd)}
          />
        </Card>
      )}
    </Screen>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <AppHeader
      title={t('lists.wishlist.title')}
      subtitle={t('lists.wishlist.subtitle')}
      leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
      rightAction={<Button title={t('common.actions.add')} variant="ghost" onPress={() => router.push(appRoutes.wishlistAdd)} />}
    />
  );
}

function WishlistItemCard({ item, onPress }: { item: BookListItemViewModel; onPress: () => void }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  return (
    <Card variant="interactive" accessibilityLabel={t('lists.wishlist.openItem', { title: item.title })} onPress={onPress}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <BookCover url={item.coverUrl} title={item.title} size="sm" />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="heading3">{item.title}</AppText>
          <AppText color="textSecondary">{item.authors}</AppText>
          <AppText color="textSecondary">{item.editionLabel}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Badge label={item.priorityLabel} variant={item.priority === 'high' ? 'active' : 'default'} />
            <Badge label={item.desiredFormatLabel} />
            <Badge label={item.targetPriceLabel} />
          </View>
        </View>
      </View>
    </Card>
  );
}
