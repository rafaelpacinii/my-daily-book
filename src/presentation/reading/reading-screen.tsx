import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { Button, Card, AppText } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import {
  appRoutes,
  readingCycleLogRoute,
  readingCycleRoute,
  readingHistoryCycleRoute,
} from '@/src/presentation/navigation/routes';

import {
  ActiveReadingCard,
  DailySummaryCard,
  ReadingHistoryCard,
} from './components';
import { useReadingScreen } from './reading-controller';

export function ReadingScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();

  if (!api) {
    return <Screen loading loadingMessage={t('reading.screen.loading')} />;
  }

  return <ReadingScreenContent api={api} />;
}

function ReadingScreenContent({
  api,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useReadingScreen(api);
  const isInitialLoading = state.status === 'idle' || (state.status === 'loading' && !state.viewModel);

  if (isInitialLoading) {
    return <Screen loading loadingMessage={t('reading.screen.loading')} />;
  }

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen
        header={
          <AppHeader
            title={t('reading.screen.title')}
            subtitle={t('reading.screen.subtitle')}
            rightAction={<Button title={t('reading.screen.startAction')} variant="ghost" onPress={() => router.push(appRoutes.readingStart)} />}
          />
        }>
        <ErrorState
          title={t('reading.screen.loadErrorTitle')}
          description={t('errors.generic')}
          actionLabel={t('common.actions.retry')}
          onAction={state.retry}
        />
      </Screen>
    );
  }

  const viewModel = state.viewModel;

  if (!viewModel) {
    return <Screen loading loadingMessage={t('reading.screen.loading')} />;
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={state.refreshing}
          onRefresh={state.refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      header={
        <AppHeader
          title={t('reading.screen.title')}
          subtitle={t('reading.screen.subtitle')}
          rightAction={<Button title={t('reading.screen.startAction')} variant="ghost" onPress={() => router.push(appRoutes.readingStart)} />}
        />
      }>
      {state.error ? (
        <ErrorState
          title={t('reading.screen.refreshErrorTitle')}
          description={t('reading.screen.refreshErrorDescription')}
          actionLabel={t('common.actions.retry')}
          onAction={state.refresh}
        />
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('reading.screen.dailySummary')} />
        <DailySummaryCard summary={viewModel.dailySummary} />
      </View>

      <Card variant="interactive" accessibilityLabel={t('reading.screen.goalsAccessibility')} onPress={() => router.push(appRoutes.goals)}>
        <AppText variant="heading3">{t('reading.screen.goalsTitle')}</AppText>
        <AppText color="textSecondary">{t('reading.screen.goalsDescription')}</AppText>
      </Card>

      <Card variant="interactive" accessibilityLabel={t('reading.screen.statisticsAccessibility')} onPress={() => router.push(appRoutes.statistics)}>
        <AppText variant="heading3">{t('reading.screen.statisticsTitle')}</AppText>
        <AppText color="textSecondary">{t('reading.screen.statisticsDescription')}</AppText>
      </Card>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('reading.screen.currentTitle')} />
        {viewModel.activeCycles.length > 0 ? (
          viewModel.activeCycles.map((cycle) => (
            <ActiveReadingCard
              key={cycle.id}
              cycle={cycle}
              onOpen={() => router.push(readingCycleRoute(cycle.id))}
              onLog={() => router.push(readingCycleLogRoute(cycle.id))}
            />
          ))
        ) : (
          <Card variant="outlined">
            <EmptyState
              icon="book-outline"
              title={t('reading.screen.emptyTitle')}
              description={t('reading.screen.emptyDescription')}
              actionLabel={t('reading.screen.startReadingAction')}
              onAction={() => router.push(appRoutes.readingStart)}
            />
          </Card>
        )}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title={t('reading.screen.historyTitle')}
          description={t('reading.screen.historyDescription')}
          action={
            <Button
              title={t('reading.screen.viewAll')}
              variant="ghost"
              onPress={() => router.push(appRoutes.readingHistory)}
            />
          }
        />
        {viewModel.recentHistory.length > 0 ? (
          viewModel.recentHistory.map((item) => (
            <ReadingHistoryCard
              key={item.id}
              item={item}
              onPress={() => router.push(readingHistoryCycleRoute(item.id))}
            />
          ))
        ) : (
          <Card variant="outlined">
            <AppText color="textSecondary">{t('reading.screen.historyEmpty')}</AppText>
          </Card>
        )}
      </View>
    </Screen>
  );
}
