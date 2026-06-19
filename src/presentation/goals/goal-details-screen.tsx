import { Alert, Platform, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Badge, Button, Card, ProgressBar } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { BookCover } from '@/src/presentation/library/components';
import {
  readingGoalAddBooksRoute,
  readingGoalEditRoute,
} from '@/src/presentation/navigation/routes';

import { useReadingGoalDetails } from './goal-details-controller';
import type { ReadingGoalDetailsViewModel, ReadingGoalItemViewModel } from './goals-types';

export function ReadingGoalDetailsScreen({ readingGoalId }: { readingGoalId: string }) {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('goals.details.loading')} />;
  return <ReadingGoalDetailsContent api={api} readingGoalId={readingGoalId} />;
}

function ReadingGoalDetailsContent({
  api,
  readingGoalId,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>;
  readingGoalId: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useReadingGoalDetails(api, readingGoalId);

  const confirmCancel = () => {
    const runCancel = () => {
      state.cancelGoal();
    };

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm(`${t('goals.details.cancelTitle')}\n\n${t('goals.details.cancelDescription')}`)) {
        runCancel();
      }
      return;
    }

    Alert.alert(
      t('goals.details.cancelTitle'),
      t('goals.details.cancelDescription'),
      [
        { text: t('goals.details.keepGoal'), style: 'cancel' },
        { text: t('goals.details.cancelGoal'), style: 'destructive', onPress: runCancel },
      ],
    );
  };

  if (state.status === 'idle' || (state.status === 'loading' && !state.viewModel)) {
    return <Screen loading loadingMessage={t('goals.details.loading')} />;
  }

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<AppHeader title={t('goals.details.title')} leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title={t('goals.details.loadErrorTitle')} description={t('goals.details.loadErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.retry} />
      </Screen>
    );
  }

  const goal = state.viewModel;
  if (!goal) return <Screen loading loadingMessage={t('goals.details.loading')} />;
  const canEdit = goal.status !== 'cancelled';

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      header={
        <AppHeader
          title={goal.name}
          subtitle={goal.statusLabel}
          leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
          rightAction={canEdit ? <Button title={t('goals.details.edit')} variant="ghost" onPress={() => router.push(readingGoalEditRoute(goal.id))} /> : undefined}
        />
      }>
      {state.error ? <ErrorState title={t('goals.details.refreshErrorTitle')} description={t('goals.details.refreshErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.refresh} /> : null}
      <GoalOverviewCard goal={goal} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {canEdit ? <Button title={t('goals.details.addBooks')} variant="secondary" onPress={() => router.push(readingGoalAddBooksRoute(goal.id))} /> : null}
        {goal.status === 'active' ? <Button title={t('goals.details.cancelGoal')} variant="danger" loading={state.submitting} onPress={confirmCancel} /> : null}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('goals.details.books')} description={goal.progressLabel} />
        {goal.items.length > 0 ? goal.items.map((item) => (
          <ReadingGoalItemCard
            key={item.id}
            item={item}
            submitting={state.submitting}
            onRemove={() => confirmRemove(item, state.removeBook, t)}
          />
        )) : (
          <Card variant="outlined">
            <EmptyState
              icon="book-outline"
              title={t('goals.details.emptyTitle')}
              description={t('goals.details.emptyDescription')}
              actionLabel={canEdit ? t('goals.details.addBooks') : undefined}
              onAction={canEdit ? () => router.push(readingGoalAddBooksRoute(goal.id)) : undefined}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}

function GoalOverviewCard({ goal }: { goal: ReadingGoalDetailsViewModel }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <View style={{ gap: theme.spacing.xs }}>
        {goal.description ? <AppText color="textSecondary">{goal.description}</AppText> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Badge label={goal.statusLabel} variant={goal.status} />
          <Badge label={goal.dueLabel} variant={goal.isOverdue ? 'cancelled' : goal.status} />
          <Badge label={goal.completionTimingLabel} variant={goal.status === 'completed' ? 'completed' : 'default'} />
        </View>
      </View>
      <ProgressBar value={goal.progressPercentage} accessibilityLabel={t('goals.screen.progress', { name: goal.name })} />
      <Metric label={t('goals.details.progress')} value={goal.progressLabel} />
      <Metric label={t('goals.details.pendingBooks')} value={String(goal.pendingBooks)} />
      <Metric label={t('goals.details.startDate')} value={goal.startDateLabel} />
      <Metric label={t('goals.details.targetDate')} value={goal.targetDateLabel} />
      <Metric label={t('goals.details.completedDate')} value={goal.completedAtLabel} />
      <Metric label={t('goals.details.daysRemaining')} value={goal.daysRemaining == null ? t('goals.details.notAvailable') : String(goal.daysRemaining)} />
    </Card>
  );
}

function ReadingGoalItemCard({
  item,
  submitting,
  onRemove,
}: {
  item: ReadingGoalItemViewModel;
  submitting: boolean;
  onRemove: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <BookCover url={item.coverUrl} title={item.title} size="sm" />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="heading3">{item.title}</AppText>
          <AppText color="textSecondary">{item.authors}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Badge label={item.libraryStatusLabel} />
            <Badge label={item.completedStateLabel} variant={item.completedAt ? 'completed' : 'default'} />
          </View>
          <AppText variant="caption" color="textSecondary">{t('goals.details.completedDateLabel', { date: item.completedAtLabel })}</AppText>
        </View>
      </View>
      <Button title={t('goals.details.removeBook')} variant="danger" disabled={submitting} onPress={onRemove} />
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

function confirmRemove(
  item: ReadingGoalItemViewModel,
  removeBook: (itemId: string) => void,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const runRemove = () => removeBook(item.id);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(t('goals.details.removeFromGoalQuestion', { title: item.title }))) {
      runRemove();
    }
    return;
  }

  Alert.alert(t('goals.details.removeTitle'), t('goals.details.removeDescription'), [
    { text: t('goals.details.keepBook'), style: 'cancel' },
    { text: t('common.actions.remove'), style: 'destructive', onPress: runRemove },
  ]);
}
