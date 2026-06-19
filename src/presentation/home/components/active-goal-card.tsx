import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Badge, Card, ProgressBar } from '@/src/components/ui';

import { formatCivilDate } from '../home-formatters';
import type { ActiveGoalViewModel } from '../home-types';

export interface ActiveGoalCardProps {
  goal: ActiveGoalViewModel;
  onPress?: () => void;
}

export function ActiveGoalCard({ goal, onPress }: ActiveGoalCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en';
  const isCompleted = goal.completedBooks >= goal.totalBooks && goal.totalBooks > 0;

  return (
    <Card variant={onPress ? 'interactive' : 'outlined'} accessibilityLabel={t('home.goals.openGoal', { name: goal.name })} onPress={onPress}>
      <View>
        <AppText variant="heading3">{goal.name}</AppText>
        <AppText color="textSecondary">
          {t('home.goals.completedProgress', { completed: goal.completedBooks, total: goal.totalBooks, count: goal.totalBooks })}
        </AppText>
      </View>
      <ProgressBar
        value={goal.progressPercentage}
        accessibilityLabel={t('home.goals.progress', { name: goal.name })}
      />
      <AppText variant="caption" color="textSecondary">
        {t('home.goals.targetDate', { date: formatCivilDate(goal.targetDate, locale) })}
      </AppText>
      <Badge label={formatDueLabel(goal.daysRemaining, isCompleted, t)} variant={goal.isOverdue ? 'cancelled' : 'active'} />
    </Card>
  );
}

function formatDueLabel(
  daysRemaining: number,
  completed: boolean,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (completed) return t('home.goals.completed');
  if (daysRemaining === 0) return t('home.goals.dueToday');
  if (daysRemaining < 0) return t('home.goals.overdueBy', { count: Math.abs(daysRemaining) });
  return t('home.goals.dueIn', { count: daysRemaining });
}
