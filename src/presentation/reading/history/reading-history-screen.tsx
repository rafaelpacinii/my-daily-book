import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { ApplicationApi } from '@/src/application';
import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { readingHistoryCycleRoute } from '@/src/presentation/navigation/routes';

import {
  ReadingFormField,
  ReadingHistoryCard,
} from '../components';
import type { ReadingHistoryItemViewModel } from '../reading-types';
import { useReadingHistory } from './reading-history-controller';

export function ReadingHistoryScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('reading.history.loading')} />;
  }

  return <ReadingHistoryContent api={api} />;
}

function ReadingHistoryContent({ api }: { api: ApplicationApi }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useReadingHistory(api);
  const isInitialLoading = state.status === 'idle' || (state.status === 'loading' && state.items.length === 0);

  if (isInitialLoading) {
    return <Screen loading loadingMessage={t('reading.history.loading')} />;
  }

  if (state.status === 'error' && state.items.length === 0) {
    return (
      <Screen
        header={
          <AppHeader
            title={t('reading.history.title')}
            leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          />
        }>
        <ErrorState
          title={t('reading.history.loadErrorTitle')}
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
          {
            gap: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
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
              title={t('reading.history.title')}
              subtitle={t('reading.history.subtitle')}
              leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
            />
            <View style={{ gap: theme.spacing.md }}>
              <SectionHeader title={t('reading.history.filters')} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {(['all', 'reading', 'completed', 'dropped'] as const).map((status) => (
                  <Button
                    key={status}
                    title={status === 'all' ? t('reading.history.all') : t(`reading.formatters.status${status[0].toUpperCase()}${status.slice(1)}`)}
                    variant={state.statusFilter === status ? 'secondary' : 'outline'}
                    onPress={() => state.setStatusFilter(status)}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <ReadingFormField
                    label={t('reading.history.start')}
                    value={state.startDate}
                    onChangeText={state.setStartDate}
                    placeholder={t('reading.start.datePlaceholder')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ReadingFormField
                    label={t('reading.history.end')}
                    value={state.endDate}
                    onChangeText={state.setEndDate}
                    placeholder={t('reading.start.datePlaceholder')}
                  />
                </View>
              </View>
            </View>
            <SectionHeader title={t('reading.history.cycles')} description={t('reading.history.records', { count: state.total })} />
            {state.error ? (
              <ErrorState
                title={t('reading.history.refreshErrorTitle')}
                description={t('reading.history.refreshErrorDescription')}
                actionLabel={t('common.actions.retry')}
                onAction={state.refresh}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Card variant="outlined">
            <EmptyState
              icon="time-outline"
              title={t('reading.history.emptyTitle')}
              description={t('reading.history.emptyDescription')}
            />
          </Card>
        }
        renderItem={({ item }: { item: ReadingHistoryItemViewModel }) => (
          <ReadingHistoryCard
            item={item}
            onPress={() => router.push(readingHistoryCycleRoute(item.id))}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListFooterComponent={
          <View style={{ gap: theme.spacing.md }}>
            {state.loadingMore ? <AppText align="center" color="textSecondary">{t('reading.history.loadingMore')}</AppText> : null}
            {state.loadMoreError ? (
              <Button title={t('reading.history.retryLoadMore')} variant="outline" onPress={state.loadMore} />
            ) : null}
            {!state.hasMore && state.items.length > 0 ? (
              <AppText align="center" color="textSecondary">{t('reading.history.endOfHistory')}</AppText>
            ) : null}
          </View>
        }
        onEndReachedThreshold={0.35}
        onEndReached={state.loadMore}
      />
    </Screen>
  );
}
