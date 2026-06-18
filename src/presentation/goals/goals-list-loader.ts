import type { ApplicationApi } from '@/src/application';

import { mapReadingGoalSummary } from './goals-mappers';
import type { ReadingGoalsListViewModel } from './goals-types';

export async function loadReadingGoalsListViewModel(
  api: ApplicationApi,
): Promise<ReadingGoalsListViewModel> {
  const page = await Promise.resolve(api.goals.listGoals({ limit: 200 }));
  const summaries = page.items.map(mapReadingGoalSummary);

  return {
    active: summaries.filter((goal) => goal.status === 'active'),
    completed: summaries.filter((goal) => goal.status === 'completed'),
    cancelled: summaries.filter((goal) => goal.status === 'cancelled'),
  };
}

