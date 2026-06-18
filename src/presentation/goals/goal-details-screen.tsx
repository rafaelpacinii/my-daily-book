import { Alert, Platform, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';

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
  if (!api) return <Screen loading loadingMessage="Loading goal" />;
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
  const state = useReadingGoalDetails(api, readingGoalId);

  const confirmCancel = () => {
    const runCancel = () => {
      state.cancelGoal();
    };

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm('Cancel this reading goal?\n\nProgress will be preserved, but the goal will no longer be active.')) {
        runCancel();
      }
      return;
    }

    Alert.alert(
      'Cancel this reading goal?',
      'Progress will be preserved, but the goal will no longer be active.',
      [
        { text: 'Keep goal', style: 'cancel' },
        { text: 'Cancel goal', style: 'destructive', onPress: runCancel },
      ],
    );
  };

  if (state.status === 'idle' || (state.status === 'loading' && !state.viewModel)) {
    return <Screen loading loadingMessage="Loading goal" />;
  }

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<AppHeader title="Reading goal" leftAction={<Button title="Back" variant="ghost" onPress={() => router.back()} />} />}>
        <ErrorState title="Unable to load this goal." description="Please try again." actionLabel="Try again" onAction={state.retry} />
      </Screen>
    );
  }

  const goal = state.viewModel;
  if (!goal) return <Screen loading loadingMessage="Loading goal" />;
  const canEdit = goal.status !== 'cancelled';

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      header={
        <AppHeader
          title={goal.name}
          subtitle={goal.statusLabel}
          leftAction={<Button title="Back" variant="ghost" onPress={() => router.back()} />}
          rightAction={canEdit ? <Button title="Edit" variant="ghost" onPress={() => router.push(readingGoalEditRoute(goal.id))} /> : undefined}
        />
      }>
      {state.error ? <ErrorState title="Unable to refresh this goal." description="The current goal is still visible." actionLabel="Try again" onAction={state.refresh} /> : null}
      <GoalOverviewCard goal={goal} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {canEdit ? <Button title="Add books" variant="secondary" onPress={() => router.push(readingGoalAddBooksRoute(goal.id))} /> : null}
        {goal.status === 'active' ? <Button title="Cancel goal" variant="danger" loading={state.submitting} onPress={confirmCancel} /> : null}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title="Books" description={goal.progressLabel} />
        {goal.items.length > 0 ? goal.items.map((item) => (
          <ReadingGoalItemCard
            key={item.id}
            item={item}
            submitting={state.submitting}
            onRemove={() => confirmRemove(item, state.removeBook)}
          />
        )) : (
          <Card variant="outlined">
            <EmptyState
              icon="book-outline"
              title="No books in this goal"
              description="Add books from your local library."
              actionLabel={canEdit ? 'Add books' : undefined}
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
      <ProgressBar value={goal.progressPercentage} accessibilityLabel={`Goal progress for ${goal.name}`} />
      <Metric label="Progress" value={goal.progressLabel} />
      <Metric label="Pending books" value={String(goal.pendingBooks)} />
      <Metric label="Start date" value={goal.startDateLabel} />
      <Metric label="Target date" value={goal.targetDateLabel} />
      <Metric label="Completed date" value={goal.completedAtLabel} />
      <Metric label="Days remaining" value={goal.daysRemaining == null ? 'Not available' : String(goal.daysRemaining)} />
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
          <AppText variant="caption" color="textSecondary">Completed date {item.completedAtLabel}</AppText>
        </View>
      </View>
      <Button title="Remove book" variant="danger" disabled={submitting} onPress={onRemove} />
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
) {
  const runRemove = () => removeBook(item.id);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`Remove ${item.title} from this goal?`)) {
      runRemove();
    }
    return;
  }

  Alert.alert('Remove book from goal?', 'The book stays in your library.', [
    { text: 'Keep book', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: runRemove },
  ]);
}

