import type { ReadingGoalStatus } from '@/src/database/schema';

export interface ReadingGoalStatusInput {
  itemCompletedDates: (string | null)[];
  currentStatus: ReadingGoalStatus;
}

export interface ReadingGoalDeadlineResult {
  completed: boolean;
  completedWithinTarget: boolean;
}
