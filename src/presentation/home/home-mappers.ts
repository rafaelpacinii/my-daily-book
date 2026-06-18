import type {
  DailyReadingSummary,
  LibraryBookSummary,
  LibraryOverview,
  ReadingGoalDetails,
  ReadingStreak,
} from '@/src/application';
import { normalizeHttpsUrl } from '@/src/presentation/library/library-formatters';

import {
  calculateCivilDaysBetween,
  formatGoalDueLabel,
} from './home-formatters';
import type {
  ActiveGoalViewModel,
  CurrentlyReadingBookViewModel,
  HomeViewModel,
} from './home-types';

export interface CreateHomeViewModelInput {
  libraryOverview: LibraryOverview;
  currentlyReading: LibraryBookSummary[];
  todaySummary: DailyReadingSummary;
  streak: ReadingStreak;
  activeGoals: ReadingGoalDetails[];
  today: string;
}

export function createHomeViewModel(input: CreateHomeViewModelInput): HomeViewModel {
  return {
    libraryOverview: {
      total: input.libraryOverview.total,
      toRead: input.libraryOverview.toRead,
      reading: input.libraryOverview.reading,
      read: input.libraryOverview.read,
      dropped: input.libraryOverview.dropped,
      owned: input.libraryOverview.owned,
    },
    currentlyReading: input.currentlyReading.slice(0, 3).map(mapCurrentlyReadingBook),
    todaySummary: {
      readingDate: input.todaySummary.readingDate,
      pagesRead: input.todaySummary.pagesRead,
      durationSeconds: input.todaySummary.durationSeconds,
      logCount: input.todaySummary.logCount,
      booksRead: input.todaySummary.booksRead,
    },
    streak: {
      current: input.streak.currentStreak,
      longest: input.streak.longestStreak,
    },
    activeGoals: input.activeGoals
      .map((goal) => mapActiveGoal(goal, input.today))
      .sort((left, right) => left.daysRemaining - right.daysRemaining)
      .slice(0, 3),
  };
}

function mapCurrentlyReadingBook(summary: LibraryBookSummary): CurrentlyReadingBookViewModel {
  const activeCycle = summary.activeReadingCycle;
  const format = summary.copies[0]?.format ?? null;

  return {
    id: summary.libraryBook.id,
    title: summary.work.title,
    authors: summary.authors.map((author) => author.name).join(', ') || 'Unknown author',
    coverUrl: normalizeHttpsUrl(summary.coverUrl),
    progressPercentage: summary.progressPercentage,
    currentPage: summary.currentPage,
    pageCount: summary.pageCount,
    lastReadDate: activeCycle?.lastReadAt ?? null,
    format,
  };
}

function mapActiveGoal(goal: ReadingGoalDetails, today: string): ActiveGoalViewModel {
  const daysRemaining = calculateCivilDaysBetween(today, goal.goal.targetDate);
  const completed = goal.completedBooks >= goal.totalBooks && goal.totalBooks > 0;

  return {
    id: goal.goal.id,
    name: goal.goal.name,
    completedBooks: goal.completedBooks,
    totalBooks: goal.totalBooks,
    progressPercentage: goal.progressPercentage,
    targetDate: goal.goal.targetDate,
    daysRemaining,
    isOverdue: daysRemaining < 0 && !completed,
    dueLabel: formatGoalDueLabel(daysRemaining, completed),
  };
}
