import type {
  BookMetadata,
  BookMetadataSource,
  EditableBookCover,
  EditableBookDraft,
  GoogleBooksVolume,
  LibraryBookDetails,
  LibraryBookSummary,
  ListLibraryBooksInput,
  PaginatedResult,
  PossibleEditionResult,
} from '@/src/application';

export type LibraryStatusFilter = 'all' | 'to_read' | 'reading' | 'read' | 'dropped';
export type OwnershipFilter = 'all' | 'owned' | 'not_owned';
export type FormatFilter = 'all' | 'physical' | 'digital';
export type LibrarySort = 'recently_added' | 'title_asc' | 'title_desc' | 'last_read';

export interface LibraryFilters {
  status: LibraryStatusFilter;
  ownership: OwnershipFilter;
  format: FormatFilter;
  authorId: string | null;
}

export interface LibraryBookViewModel {
  id: string;
  title: string;
  originalTitle: string | null;
  authors: string;
  coverUrl: string | null;
  status: LibraryStatusFilter;
  statusLabel: string;
  progressPercentage: number | null;
  formatLabel: string | null;
  copyCount: number;
  lastReadDate: string | null;
  rating: number | null;
}

export interface LibraryListViewModel {
  items: LibraryBookViewModel[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface LibraryScreenState extends LibraryListViewModel {
  query: string;
  debouncedQuery: string;
  filters: LibraryFilters;
  sort: LibrarySort;
  status: 'idle' | 'loading' | 'success' | 'error';
  refreshing: boolean;
  loadingMore: boolean;
  error: unknown;
  loadMoreError: unknown;
  setQuery: (query: string) => void;
  clearQueryAndFilters: () => void;
  setStatusFilter: (status: LibraryStatusFilter) => void;
  setOwnershipFilter: (ownership: OwnershipFilter) => void;
  setFormatFilter: (format: FormatFilter) => void;
  setSort: (sort: LibrarySort) => void;
  retry: () => void;
  refresh: () => void;
  loadMore: () => void;
}

export interface LibraryBookDetailsViewModel {
  id: string;
  title: string;
  originalTitle: string | null;
  authors: string;
  description: string | null;
  coverUrl: string | null;
  status: LibraryStatusFilter;
  statusLabel: string;
  progressPercentage: number | null;
  rating: number | null;
  notes: string | null;
  editions: LibraryEditionViewModel[];
  copies: LibraryCopyViewModel[];
  readingHistory: ReadingCycleSummaryViewModel[];
  lists: string[];
  goals: string[];
}

export interface LibraryEditionViewModel {
  id: string;
  title: string;
  publisher: string | null;
  publishedDate: string | null;
  language: string | null;
  pageCount: number | null;
  isbn10: string | null;
  isbn13: string | null;
  coverUrl: string | null;
  hasCopy: boolean;
}

export interface LibraryCopyViewModel {
  id: string;
  editionId: string;
  editionTitle: string;
  format: 'physical' | 'digital';
  formatLabel: string;
  label: string | null;
  acquiredAt: string | null;
  notes: string | null;
}

export interface ReadingCycleSummaryViewModel {
  id: string;
  cycleNumber: number;
  status: string;
  editionTitle: string;
  startedAt: string;
  finishedAt: string | null;
  droppedAt: string | null;
  totalPages: number;
  totalDurationSeconds: number;
}

export interface AddCopyFormState {
  editionId: string;
  format: 'physical' | 'digital';
  label: string;
  acquiredAt: string;
  notes: string;
}

export interface GoogleBooksResultViewModel {
  source: Exclude<BookMetadataSource, 'manual'>;
  externalId: string;
  googleBooksId: string | null;
  title: string;
  subtitle: string | null;
  authors: string;
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  language: string | null;
  isbn: string | null;
  coverUrl: string | null;
  sourceLabel: string;
}

export interface GoogleBooksSearchState {
  query: string;
  items: GoogleBooksResultViewModel[];
  totalItems: number;
  startIndex: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  loadingMore: boolean;
  error: unknown;
  loadMoreError: unknown;
  hasMore: boolean;
  setQuery: (query: string) => void;
  submit: () => void;
  retry: () => void;
  loadMore: () => void;
}

export interface GoogleBookDetailsViewModel extends GoogleBooksResultViewModel {
  description: string | null;
  isbn10: string | null;
  isbn13: string | null;
  previewLink: string | null;
  infoLink: string | null;
}

export interface PossibleEditionViewModel extends GoogleBooksResultViewModel {
  score: number;
  reasons: string[];
}

export interface AddBookConfirmationState {
  workMode: 'create' | 'existing';
  existingLibraryBookId: string;
  owned: boolean;
  format: 'physical' | 'digital';
  copyLabel: string;
  acquiredAt: string;
  notes: string;
}

export type EditableBookDraftFormState = EditableBookDraft;

export interface EditableDraftDuplicateViewModel {
  exactEditionLibraryBookId: string | null;
  exactEditionReason: 'external_id' | 'isbn13' | 'isbn10' | null;
  suggestedLibraryBookIds: string[];
}

export type EditableBookCoverViewModel = EditableBookCover;

export interface AddBookValidationResult {
  valid: boolean;
  message: string | null;
}

export type LibraryQueryInput = ListLibraryBooksInput;
export type LibraryPageResult = PaginatedResult<LibraryBookSummary>;
export type LibraryDetailsResult = LibraryBookDetails;
export type GoogleVolumeResult = GoogleBooksVolume;
export type BookMetadataResult = BookMetadata;
export type PossibleEditionsResult = PossibleEditionResult[];
