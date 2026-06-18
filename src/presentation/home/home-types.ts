export interface HomeViewModel {
  libraryOverview: LibraryOverviewViewModel;
  currentlyReading: CurrentlyReadingBookViewModel[];
  todaySummary: TodaySummaryViewModel;
  streak: ReadingStreakViewModel;
  activeGoals: ActiveGoalViewModel[];
}

export interface LibraryOverviewViewModel {
  total: number;
  toRead: number;
  reading: number;
  read: number;
  dropped: number;
  owned: number;
}

export interface CurrentlyReadingBookViewModel {
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  progressPercentage: number | null;
  currentPage: number | null;
  pageCount: number | null;
  lastReadDate: string | null;
  format: string | null;
}

export interface TodaySummaryViewModel {
  readingDate: string;
  pagesRead: number;
  durationSeconds: number;
  logCount: number;
  booksRead: number;
}

export interface ReadingStreakViewModel {
  current: number;
  longest: number;
}

export interface ActiveGoalViewModel {
  id: string;
  name: string;
  completedBooks: number;
  totalBooks: number;
  progressPercentage: number;
  targetDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  dueLabel: string;
}

export type HomeStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

export interface HomeState {
  status: HomeStatus;
  viewModel: HomeViewModel | null;
  error: unknown;
  retry: () => void;
  refresh: () => void;
}
