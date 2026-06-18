import { View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/src/components/feedback';
import { SectionHeader } from '@/src/components/layout';
import { Button, Card } from '@/src/components/ui';
import { appRoutes, readingGoalRoute } from '@/src/presentation/navigation/routes';

import type { ActiveGoalViewModel } from '../home-types';
import { ActiveGoalCard } from './active-goal-card';

export interface ActiveGoalsSectionProps {
  goals: ActiveGoalViewModel[];
}

export function ActiveGoalsSection({ goals }: ActiveGoalsSectionProps) {
  return (
    <View>
      <SectionHeader
        title="Active goals"
        action={<Button title="View goals" variant="ghost" onPress={() => router.push(appRoutes.goals)} />}
      />
      {goals.length === 0 ? (
        <Card variant="outlined">
          <EmptyState
            icon="flag-outline"
            title="No active goals"
            description="Future goals will appear here when they are created."
          />
        </Card>
      ) : (
        goals.map((goal) => (
          <ActiveGoalCard
            key={goal.id}
            goal={goal}
            onPress={() => router.push(readingGoalRoute(goal.id))}
          />
        ))
      )}
    </View>
  );
}
