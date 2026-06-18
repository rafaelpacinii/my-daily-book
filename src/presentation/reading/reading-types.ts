import type {
  DailyReadingSummary,
  LibraryBookDetails,
  LibraryBookSummary,
  ReadingCycleDetails,
  ReadingHistoryItem,
  ReadingLogSummary,
} from '@/src/application';

export type ReadingCycleStatusView = ReadingCycleDetails['cycle']['status'];

export interface ReadingLogViewModel {
  id: string;
  readingCycleId: string;
  readingDate: string;
  dateLabel: string;
  pageRangeLabel: string;
  pagesReadLabel: string;
  pagesRead: number;
  startPage: number;
  endPage: number;
  durationSeconds: number | null;
  durationLabel: string;
  notes: string | null;
  createdAt: number;
}

export interface ReadingCycleViewModel {
  id: string;
  libraryBookId: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  editionTitle: string;
  editionMeta: string;
  copyFormatLabel: string;
  cycleNumber: number;
  cycleNumberLabel: string;
  status: ReadingCycleStatusView;
  statusLabel: string;
  startedAt: string;
  startedAtLabel: string;
  finishedAt: string | null;
  finishedAtLabel: string | null;
  droppedAt: string | null;
  droppedAtLabel: string | null;
  lastReadAt: string | null;
  lastReadAtLabel: string;
  currentPage: number | null;
  currentPageLabel: string;
  pageCount: number | null;
  pageCountLabel: string;
  progressPercentage: number | null;
  progressLabel: string;
  totalPagesRead: number;
  totalPagesReadLabel: string;
  totalDurationSeconds: number;
  totalDurationLabel: string;
  readingDays: number;
  readingDaysLabel: string;
  rating: number | null;
  notes: string | null;
  logs: ReadingLogViewModel[];
}

export interface ActiveReadingViewModel extends ReadingCycleViewModel {
  nextStartPage: number;
}

export interface DailyReadingSummaryViewModel {
  readingDate: string;
  pagesReadLabel: string;
  durationLabel: string;
  sessionsLabel: string;
  booksLabel: string;
}

export interface ReadingHomeViewModel {
  activeCycles: ActiveReadingViewModel[];
  dailySummary: DailyReadingSummaryViewModel;
  recentHistory: ReadingHistoryItemViewModel[];
}

export interface ReadingHistoryItemViewModel {
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  cycleNumberLabel: string;
  status: ReadingCycleStatusView;
  statusLabel: string;
  startedAtLabel: string;
  endedAtLabel: string;
  totalPagesReadLabel: string;
  totalDurationLabel: string;
  readingDaysLabel: string;
}

export interface StartReadingBookOption {
  id: string;
  title: string;
  authors: string;
  statusLabel: string;
  coverUrl: string | null;
  owned: boolean;
  active: boolean;
  nextCycleNumberLabel: string;
  reread: boolean;
}

export interface StartReadingEditionOption {
  id: string;
  title: string;
  publisher: string | null;
  publishedDate: string | null;
  language: string | null;
  pageCount: number | null;
  isbn: string | null;
  coverUrl: string | null;
}

export interface StartReadingCopyOption {
  id: string;
  editionId: string;
  formatLabel: string;
  label: string;
}

export interface StartReadingDetailsViewModel {
  book: StartReadingBookOption;
  editions: StartReadingEditionOption[];
  copies: StartReadingCopyOption[];
}

export interface ReadingScreenState {
  status: 'idle' | 'loading' | 'success' | 'error';
  refreshing: boolean;
  viewModel: ReadingHomeViewModel | null;
  error: unknown;
  retry: () => void;
  refresh: () => void;
}

export interface ReadingHistoryState {
  status: 'idle' | 'loading' | 'success' | 'error';
  refreshing: boolean;
  loadingMore: boolean;
  items: ReadingHistoryItemViewModel[];
  total: number;
  hasMore: boolean;
  error: unknown;
  loadMoreError: unknown;
  statusFilter: ReadingCycleStatusView | 'all';
  startDate: string;
  endDate: string;
  setStatusFilter: (status: ReadingCycleStatusView | 'all') => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  retry: () => void;
  refresh: () => void;
  loadMore: () => void;
}

export type ReadingCycleDetailsResult = ReadingCycleDetails;
export type ReadingLogSummaryResult = ReadingLogSummary;
export type DailyReadingSummaryResult = DailyReadingSummary;
export type ReadingHistoryResult = ReadingHistoryItem;
export type LibraryBookSummaryResult = LibraryBookSummary;
export type LibraryBookDetailsResult = LibraryBookDetails;
