import type { ReadingGoalStatus } from '@/src/database/schema';

export function determineReadingGoalStatus(
  itemCompletedDates: (string | null)[],
  currentStatus: ReadingGoalStatus,
): ReadingGoalStatus {
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  return itemCompletedDates.length > 0 && itemCompletedDates.every(Boolean) ? 'completed' : 'active';
}
