import type {
  Author,
  BookCopy,
  BookList,
  BookListItem,
  Edition,
  LibraryBook,
  PurchaseLink,
  ReadingCycle,
  ReadingGoal,
  ReadingGoalItem,
  ReadingLog,
  Work,
} from '@/src/database/types';
import type {
  BookCopyFormat,
  LibraryBookStatus,
  ReadingCycleStatus,
  ReadingGoalStatus,
} from '@/src/database/schema';

export interface LibraryOverview {
  total: number;
  toRead: number;
  reading: number;
  read: number;
  dropped: number;
  owned: number;
  notOwned: number;
  physicalCopies: number;
  digitalCopies: number;
}

export interface LibraryBookSummary {
  libraryBook: LibraryBook;
  work: Work;
  authors: Author[];
  copies: BookCopy[];
  activeReadingCycle: ReadingCycle | null;
  latestReadingCycle: ReadingCycle | null;
  currentPage: number | null;
  pageCount: number | null;
  isbn10: string | null;
  isbn13: string | null;
  progressPercentage: number | null;
  coverUrl: string | null;
}

export interface LibraryBookDetails extends LibraryBookSummary {
  editions: Edition[];
  cycles: ReadingCycle[];
  readingLogsByCycle: ReadingCycleLogs[];
  lists: BookListMembership[];
  goals: ReadingGoalMembership[];
}

export interface ReadingCycleLogs {
  cycle: ReadingCycle;
  logs: ReadingLog[];
}

export interface BookListMembership {
  list: BookList;
  item: BookListItem;
}

export interface ReadingGoalMembership {
  goal: ReadingGoal;
  item: ReadingGoalItem;
}

export interface ReadingCycleDetails {
  cycle: ReadingCycle;
  libraryBook: LibraryBook;
  work: Work;
  authors: Author[];
  edition: Edition;
  copy: BookCopy | null;
  logs: ReadingLog[];
  progressPercentage: number | null;
  totalPagesRead: number;
  totalDurationSeconds: number;
}

export interface ReadingHistoryItem {
  cycle: ReadingCycle;
  libraryBook: LibraryBook;
  work: Work;
  authors: Author[];
  edition: Edition;
  totalPagesRead: number;
  totalDurationSeconds: number;
}

export interface ReadingLogSummary {
  log: ReadingLog;
  cycle: ReadingCycle;
  libraryBook: LibraryBook;
  work: Work;
  authors: Author[];
  pagesRead: number;
}

export interface DailyReadingSummary {
  readingDate: string;
  pagesRead: number;
  durationSeconds: number;
  logCount: number;
  booksRead: number;
  logs: ReadingLogSummary[];
}

export interface BookListItemDetails {
  item: BookListItem;
  work: Work;
  authors: Author[];
  edition: Edition | null;
  purchaseLinks: PurchaseLink[];
  owned: boolean;
}

export interface BookListDetails {
  list: BookList;
  items: BookListItemDetails[];
}

export interface ReadingGoalDetails {
  goal: ReadingGoal;
  items: ReadingGoalItemDetails[];
  totalBooks: number;
  completedBooks: number;
  pendingBooks: number;
  progressPercentage: number;
  daysRemaining: number | null;
  isOverdue: boolean;
  isCompletedWithinDeadline: boolean;
}

export interface ReadingGoalItemDetails {
  item: ReadingGoalItem;
  libraryBook: LibraryBook;
  work: Work;
  authors: Author[];
}

export interface ReadingStatistics {
  totalPagesRead: number;
  totalDurationSeconds: number;
  totalLogs: number;
  totalReadingDays: number;
  totalCompletedCycles: number;
  totalRereads: number;
  totalCompletedWorks: number;
  averagePagesPerReadingDay: number;
  averagePagesPerLog: number;
  averageDurationPerReadingDay: number;
  currentStreak: number;
  longestStreak: number;
  mostPagesInOneDay: number;
  mostTimeInOneDay: number;
}

export interface PeriodReadingStatistics extends ReadingStatistics {
  daily: PeriodBucket[];
  weekly: PeriodBucket[];
  monthly: PeriodBucket[];
}

export interface PeriodBucket {
  key: string;
  pagesRead: number;
  durationSeconds: number;
  logCount: number;
}

export interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  latestReadingDate: string | null;
}

export interface BookReadingStatistics {
  libraryBook: LibraryBook;
  work: Work;
  authors: Author[];
  totalCycles: number;
  completedCycles: number;
  droppedCycles: number;
  rereadCount: number;
  totalPagesRead: number;
  totalDurationSeconds: number;
  readingDays: number;
  firstStartedAt: string | null;
  latestFinishedAt: string | null;
  averagePagesPerDay: number;
  averageDurationPerDay: number;
}

export interface AuthorReadingStatistics {
  author: Author;
  worksRead: number;
  completedCycles: number;
  pagesRead: number;
  durationSeconds: number;
  averageRating: number | null;
  rereads: number;
}

export interface FormatReadingStatistics {
  format: BookCopyFormat | 'unknown';
  completedCycles: number;
  pagesRead: number;
  durationSeconds: number;
}

export interface ListLibraryBooksInput {
  status?: LibraryBookStatus;
  search?: string;
  authorId?: string;
  format?: BookCopyFormat;
  owned?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'title' | 'addedAt' | 'lastReadAt';
  orderDirection?: 'asc' | 'desc';
}

export interface ListReadingHistoryInput {
  libraryBookId?: string;
  startDate?: string;
  endDate?: string;
  status?: ReadingCycleStatus;
  limit?: number;
  offset?: number;
  orderBy?: 'startedAt' | 'finishedAt' | 'lastReadAt';
  orderDirection?: 'asc' | 'desc';
}

export interface ListReadingGoalsInput {
  status?: ReadingGoalStatus;
  limit?: number;
  offset?: number;
}
