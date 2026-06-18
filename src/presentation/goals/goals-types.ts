import type { ReadingGoalDetails } from '@/src/application';
import type { LibraryBookViewModel } from '@/src/presentation/library/library-types';

export type ReadingGoalStatusValue = ReadingGoalDetails['goal']['status'];

export interface ReadingGoalSummaryViewModel {
  id: string;
  name: string;
  description: string | null;
  status: ReadingGoalStatusValue;
  statusLabel: string;
  completedBooks: number;
  totalBooks: number;
  pendingBooks: number;
  progressPercentage: number;
  progressLabel: string;
  startDate: string;
  targetDate: string;
  startDateLabel: string;
  targetDateLabel: string;
  daysRemaining: number | null;
  dueLabel: string;
  isOverdue: boolean;
  completionTimingLabel: string;
}

export interface ReadingGoalItemViewModel {
  id: string;
  libraryBookId: string;
  title: string;
  authors: string;
  libraryStatusLabel: string;
  completedAt: string | null;
  completedAtLabel: string;
  completedStateLabel: string;
  coverUrl: string | null;
}

export interface ReadingGoalDetailsViewModel extends ReadingGoalSummaryViewModel {
  completedAt: string | null;
  completedAtLabel: string;
  items: ReadingGoalItemViewModel[];
}

export interface ReadingGoalsListViewModel {
  active: ReadingGoalSummaryViewModel[];
  completed: ReadingGoalSummaryViewModel[];
  cancelled: ReadingGoalSummaryViewModel[];
}

export interface ReadingGoalBooksViewModel {
  books: LibraryBookViewModel[];
  existingBookIds: string[];
}

