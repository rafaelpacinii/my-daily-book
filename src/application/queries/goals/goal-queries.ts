import { EntityNotFoundError } from '@/src/database/errors';
import type { ReadingGoal } from '@/src/database/types';
import { compareIsoDates, getTodayIsoDate } from '@/src/domain/shared';

import { findAuthorsForWork, readModelSnapshot } from '../read-model-store';
import { paginateItems, type PaginatedResult } from '../shared';
import type { ListReadingGoalsInput, ReadingGoalDetails } from '../models';

export function listReadingGoals(
  input: ListReadingGoalsInput = {},
): PaginatedResult<ReadingGoalDetails> {
  const snapshot = readModelSnapshot();
  const today = getTodayIsoDate();
  const items = snapshot.readingGoals
    .filter((goal) => !input.status || goal.status === input.status)
    .map((goal) => buildReadingGoalDetails(snapshot, goal, today));

  return paginateItems(items, input);
}

export function getReadingGoalDetails(goalId: string): ReadingGoalDetails {
  const snapshot = readModelSnapshot();
  const goal = snapshot.readingGoals.find((item) => item.id === goalId);

  if (!goal) {
    throw new EntityNotFoundError('ReadingGoal', goalId);
  }

  return buildReadingGoalDetails(snapshot, goal, getTodayIsoDate());
}

export function getActiveReadingGoals(): ReadingGoalDetails[] {
  return listReadingGoals({ status: 'active', limit: 200 }).items;
}

function buildReadingGoalDetails(
  snapshot: ReturnType<typeof readModelSnapshot>,
  goal: ReadingGoal,
  today: string | null,
): ReadingGoalDetails {
  const items = snapshot.readingGoalItems
    .filter((item) => item.readingGoalId === goal.id)
    .map((item) => {
      const libraryBook = snapshot.libraryBooks.find((book) => book.id === item.libraryBookId);
      if (!libraryBook) throw new EntityNotFoundError('LibraryBook', item.libraryBookId);

      const work = snapshot.works.find((candidate) => candidate.id === libraryBook.workId);
      if (!work) throw new EntityNotFoundError('Work', libraryBook.workId);

      return { item, libraryBook, work, authors: findAuthorsForWork(snapshot, work.id) };
    });
  const completedBooks = items.filter(({ item }) => item.completedAt != null).length;
  const totalBooks = items.length;
  const daysRemaining = today ? calculateDaysRemaining(today, goal.targetDate) : null;

  return {
    goal,
    items,
    totalBooks,
    completedBooks,
    pendingBooks: totalBooks - completedBooks,
    progressPercentage: totalBooks === 0 ? 0 : (completedBooks / totalBooks) * 100,
    daysRemaining,
    isOverdue: goal.status === 'active' && today != null && compareIsoDates(today, goal.targetDate) > 0,
    isCompletedWithinDeadline:
      goal.status === 'completed' &&
      goal.completedAt != null &&
      compareIsoDates(goal.completedAt, goal.targetDate) <= 0,
  };
}

function calculateDaysRemaining(today: string, targetDate: string): number {
  const todayTime = Date.parse(`${today}T00:00:00.000Z`);
  const targetTime = Date.parse(`${targetDate}T00:00:00.000Z`);

  return Math.ceil((targetTime - todayTime) / 86_400_000);
}
