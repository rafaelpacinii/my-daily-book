import { View } from 'react-native';

import { AppText, Badge, Card, ProgressBar } from '@/src/components/ui';

import { formatCivilDate, pluralize } from '../home-formatters';
import type { ActiveGoalViewModel } from '../home-types';

export interface ActiveGoalCardProps {
  goal: ActiveGoalViewModel;
  onPress?: () => void;
}

export function ActiveGoalCard({ goal, onPress }: ActiveGoalCardProps) {
  return (
    <Card variant={onPress ? 'interactive' : 'outlined'} accessibilityLabel={`Open reading goal ${goal.name}`} onPress={onPress}>
      <View>
        <AppText variant="heading3">{goal.name}</AppText>
        <AppText color="textSecondary">
          {goal.completedBooks} of {pluralize(goal.totalBooks, 'book')} completed
        </AppText>
      </View>
      <ProgressBar
        value={goal.progressPercentage}
        accessibilityLabel={`Goal progress for ${goal.name}`}
      />
      <AppText variant="caption" color="textSecondary">
        Target date {formatCivilDate(goal.targetDate)}
      </AppText>
      <Badge label={goal.dueLabel} variant={goal.isOverdue ? 'cancelled' : 'active'} />
    </Card>
  );
}
