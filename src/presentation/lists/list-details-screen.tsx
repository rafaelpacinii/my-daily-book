import { Alert, Platform, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { BookCover } from '@/src/presentation/library/components';
import {
  bookListAddBookRoute,
  bookListEditRoute,
  wishlistItemRoute,
} from '@/src/presentation/navigation/routes';

import { useBookListDetails } from './list-details-controller';
import type { BookListItemViewModel } from './lists-types';

export function BookListDetailsScreen({ bookListId }: { bookListId: string }) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('lists.details.loading')} />;
  return <BookListDetailsContent api={api} bookListId={bookListId} />;
}

function BookListDetailsContent({ api, bookListId }: { api: NonNullable<ReturnType<typeof useApplication>['api']>; bookListId: string }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useBookListDetails(api, bookListId);

  const confirmDelete = () => {
    const runDelete = () => {
      state.deleteList().then((deleted) => {
        if (deleted) router.replace('/(tabs)/lists');
      });
    };
    if (Platform.OS === 'web') runDelete();
    else Alert.alert(t('lists.details.deleteTitle'), t('lists.details.deleteDescription'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.delete'), style: 'destructive', onPress: runDelete },
    ]);
  };

  if (state.status === 'idle' || (state.status === 'loading' && !state.viewModel)) {
    return <Screen loading loadingMessage={t('lists.details.loading')} />;
  }

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<AppHeader title={t('lists.details.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('lists.details.loadErrorTitle')} description={t('lists.details.loadErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.retry} />
      </Screen>
    );
  }

  const list = state.viewModel;
  if (!list) return <Screen loading loadingMessage={t('lists.details.loading')} />;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      header={
        <AppHeader
          title={list.name}
          subtitle={list.itemCountLabel}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          rightAction={<Button title={t('common.actions.edit')} variant="ghost" onPress={() => router.push(bookListEditRoute(list.id))} />}
        />
      }>
      {state.error ? <ErrorState title={t('lists.details.refreshErrorTitle')} description={t('lists.details.refreshErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.refresh} /> : null}
      {list.description ? <AppText color="textSecondary">{list.description}</AppText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Button title={t('lists.details.addBooks')} variant="secondary" onPress={() => router.push(bookListAddBookRoute(list.id))} />
        <Button title={t('lists.details.deleteList')} variant="danger" loading={state.submitting} onPress={confirmDelete} />
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('lists.details.booksTitle')} description={list.itemCountLabel} />
        {list.items.length > 0 ? list.items.map((item, index) => (
          <BookListItemCard
            key={item.id}
            item={item}
            canMoveUp={index > 0}
            canMoveDown={index < list.items.length - 1}
            submitting={state.submitting}
            onOpen={list.type === 'wishlist' ? () => router.push(wishlistItemRoute(item.id)) : undefined}
            onMoveUp={() => state.moveItem(item.id, -1)}
            onMoveDown={() => state.moveItem(item.id, 1)}
            onRemove={() => state.removeItem(item.id)}
          />
        )) : (
          <Card variant="outlined">
            <EmptyState
              icon="book-outline"
              title={t('lists.details.emptyTitle')}
              description={t('lists.details.emptyDescription')}
              actionLabel={t('lists.details.addBooks')}
              onAction={() => router.push(bookListAddBookRoute(list.id))}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}

function BookListItemCard({
  item,
  canMoveUp,
  canMoveDown,
  submitting,
  onOpen,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: BookListItemViewModel;
  canMoveUp: boolean;
  canMoveDown: boolean;
  submitting: boolean;
  onOpen?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant={onOpen ? 'interactive' : 'outlined'} onPress={onOpen}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <BookCover url={item.coverUrl} title={item.title} size="sm" />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="heading3">{item.title}</AppText>
          <AppText color="textSecondary">{item.authors}</AppText>
          <AppText color="textSecondary">{item.editionLabel}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Badge label={item.positionLabel} />
            <Badge label={item.ownedLabel} variant={item.owned ? 'read' : 'default'} />
          </View>
          {item.notes ? <AppText color="textSecondary">{item.notes}</AppText> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Button title={t('lists.details.moveUp')} variant="outline" disabled={!canMoveUp || submitting} onPress={onMoveUp} />
        <Button title={t('lists.details.moveDown')} variant="outline" disabled={!canMoveDown || submitting} onPress={onMoveDown} />
        <Button title={t('lists.details.remove')} variant="danger" disabled={submitting} onPress={onRemove} />
      </View>
    </Card>
  );
}
