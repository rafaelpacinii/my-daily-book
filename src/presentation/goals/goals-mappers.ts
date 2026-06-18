import type { LibraryBookSummary, ReadingGoalDetails } from '@/src/application';
import { formatAuthors, formatLibraryStatus } from '@/src/presentation/library/library-formatters';
import { mapLibraryBookSummary } from '@/src/presentation/library/library-mappers';

import {
  compareCivilDates,
  formatBooksProgress,
  formatCivilDate,
  formatCompletionTiming,
  formatDueLabel,
  formatGoalStatus,
} from './goals-formatters';
import type {
  ReadingGoalDetailsViewModel,
  ReadingGoalItemViewModel,
  ReadingGoalSummaryViewModel,
} from './goals-types';

export function mapReadingGoalSummary(details: ReadingGoalDetails): ReadingGoalSummaryViewModel {
  return {
    id: details.goal.id,
    name: details.goal.name,
    description: details.goal.description,
    status: details.goal.status,
    statusLabel: formatGoalStatus(details.goal.status),
    completedBooks: details.completedBooks,
    totalBooks: details.totalBooks,
    pendingBooks: details.pendingBooks,
    progressPercentage: details.progressPercentage,
    progressLabel: formatBooksProgress(details.completedBooks, details.totalBooks),
    startDate: details.goal.startDate,
    targetDate: details.goal.targetDate,
    startDateLabel: formatCivilDate(details.goal.startDate),
    targetDateLabel: formatCivilDate(details.goal.targetDate),
    daysRemaining: details.daysRemaining,
    dueLabel: details.goal.status === 'active'
      ? formatDueLabel(details.daysRemaining, details.isOverdue)
      : formatCompletionTiming(details.goal.status, details.isCompletedWithinDeadline),
    isOverdue: details.isOverdue,
    completionTimingLabel: formatCompletionTiming(
      details.goal.status,
      details.isCompletedWithinDeadline,
    ),
  };
}

export function mapReadingGoalDetails(details: ReadingGoalDetails): ReadingGoalDetailsViewModel {
  return {
    ...mapReadingGoalSummary(details),
    completedAt: details.goal.completedAt,
    completedAtLabel: formatCivilDate(details.goal.completedAt),
    items: details.items.map((item) => mapReadingGoalItem(item, details.goal.targetDate)),
  };
}

export function mapLibraryBooksForGoalSelection(items: LibraryBookSummary[]) {
  return items.map(mapLibraryBookSummary);
}

function mapReadingGoalItem(
  details: ReadingGoalDetails['items'][number],
  targetDate: string,
): ReadingGoalItemViewModel {
  const completedAt = details.item.completedAt;

  return {
    id: details.item.id,
    libraryBookId: details.item.libraryBookId,
    title: details.work.title,
    authors: formatAuthors(details.authors.map((author) => author.name)),
    libraryStatusLabel: formatLibraryStatus(details.libraryBook.status),
    completedAt,
    completedAtLabel: formatCivilDate(completedAt),
    completedStateLabel: getCompletedStateLabel(completedAt, targetDate),
    coverUrl: null,
  };
}

function getCompletedStateLabel(completedAt: string | null, targetDate: string): string {
  if (!completedAt) return 'Pending';
  return compareCivilDates(completedAt, targetDate) <= 0 ? 'Completed' : 'Completed after deadline';
}

