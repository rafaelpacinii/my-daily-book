import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card, ProgressBar } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { appRoutes, readingGoalRoute } from '@/src/presentation/navigation/routes';

import { useReadingGoalsScreen } from './goals-controller';
import type { ReadingGoalSummaryViewModel } from './goals-types';

export function ReadingGoalsScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('goals.screen.loading')} />;
  return <ReadingGoalsScreenContent api={api} />;
}

function ReadingGoalsScreenContent({
  api,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useReadingGoalsScreen(api);
  const loading = state.status === 'idle' || (state.status === 'loading' && !state.viewModel);

  if (loading) return <Screen loading loadingMessage={t('goals.screen.loading')} />;

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<Header />}>
        <ErrorState title={t('goals.screen.loadErrorTitle')} description={t('errors.generic')} actionLabel={t('common.actions.retry')} onAction={state.retry} />
      </Screen>
    );
  }

  const viewModel = state.viewModel;
  if (!viewModel) return <Screen loading loadingMessage={t('goals.screen.loading')} />;

  const hasGoals =
    viewModel.active.length + viewModel.completed.length + viewModel.cancelled.length > 0;

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
      header={<Header />}>
      {state.error ? (
        <ErrorState title={t('goals.screen.refreshErrorTitle')} description={t('goals.screen.refreshErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.refresh} />
      ) : null}

      {!hasGoals ? (
        <Card variant="outlined">
          <EmptyState
            icon="flag-outline"
            title={t('goals.screen.emptyTitle')}
            description={t('goals.screen.emptyDescription')}
            actionLabel={t('goals.screen.createAction')}
            onAction={() => router.push(appRoutes.goalsCreate)}
          />
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          <GoalsSection title={t('goals.screen.activeTitle')} goals={viewModel.active} emptyLabel={t('goals.screen.noActive')} />
          <GoalsSection title={t('goals.screen.completedTitle')} goals={viewModel.completed} emptyLabel={t('goals.screen.noCompleted')} />
          <GoalsSection title={t('goals.screen.cancelledTitle')} goals={viewModel.cancelled} emptyLabel={t('goals.screen.noCancelled')} />
        </View>
      )}
    </Screen>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <AppHeader
      title={t('goals.screen.title')}
      subtitle={t('goals.screen.subtitle')}
      leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
      rightAction={<Button title={t('common.actions.create')} variant="ghost" onPress={() => router.push(appRoutes.goalsCreate)} />}
    />
  );
}

function GoalsSection({
  title,
  goals,
  emptyLabel,
}: {
  title: string;
  goals: ReadingGoalSummaryViewModel[];
  emptyLabel: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={title} description={t('goals.screen.sectionCount', { count: goals.length })} />
      {goals.length > 0 ? (
        goals.map((goal) => <ReadingGoalSummaryCard key={goal.id} goal={goal} />)
      ) : (
        <Card variant="outlined">
          <AppText color="textSecondary">{emptyLabel}</AppText>
        </Card>
      )}
    </View>
  );
}

function ReadingGoalSummaryCard({ goal }: { goal: ReadingGoalSummaryViewModel }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card
      variant="interactive"
      accessibilityLabel={t('goals.screen.openGoal', { name: goal.name })}
      onPress={() => router.push(readingGoalRoute(goal.id))}>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="heading3">{goal.name}</AppText>
        {goal.description ? <AppText color="textSecondary">{goal.description}</AppText> : null}
        <AppText color="textSecondary">{goal.progressLabel}</AppText>
      </View>
      <ProgressBar value={goal.progressPercentage} accessibilityLabel={t('goals.screen.progress', { name: goal.name })} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Badge label={goal.statusLabel} variant={goal.status} />
        <Badge label={goal.dueLabel} variant={goal.isOverdue ? 'cancelled' : goal.status} />
      </View>
      <AppText variant="caption" color="textSecondary">
        {t('goals.screen.dateRange', { start: goal.startDateLabel, end: goal.targetDateLabel })}
      </AppText>
    </Card>
  );
}
