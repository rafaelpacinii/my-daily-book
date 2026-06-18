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
  WorkAuthor,
} from '@/src/database/types';

export const BACKUP_APPLICATION_NAME = 'My Daily Book';
export const BACKUP_FILE_EXTENSION = '.mdb-backup.json';
export const CURRENT_BACKUP_FORMAT_VERSION = 1;
export const CURRENT_DATABASE_SCHEMA_VERSION = 3;
export const MAX_BACKUP_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export type BackupPlatform = 'android' | 'ios' | 'web' | 'unknown';
export type RestoreStrategy = 'replace' | 'merge';

export interface BackupCoverAsset {
  editionId: string;
  fileName: string;
  mimeType: string;
  base64: string;
}

export interface BackupManifest {
  application: typeof BACKUP_APPLICATION_NAME;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  platform: BackupPlatform;
  applicationVersion: string | null;
}

export interface BackupData {
  authors: Author[];
  works: Work[];
  workAuthors: WorkAuthor[];
  editions: Edition[];
  coverAssets: BackupCoverAsset[];
  libraryBooks: LibraryBook[];
  bookCopies: BookCopy[];
  readingCycles: ReadingCycle[];
  readingLogs: ReadingLog[];
  bookLists: BookList[];
  bookListItems: BookListItem[];
  purchaseLinks: PurchaseLink[];
  readingGoals: ReadingGoal[];
  readingGoalItems: ReadingGoalItem[];
}

export interface BackupFile {
  manifest: BackupManifest;
  data: BackupData;
  checksum: string;
}

export interface BackupCounts {
  authors: number;
  works: number;
  workAuthors: number;
  editions: number;
  coverAssets: number;
  libraryBooks: number;
  bookCopies: number;
  readingCycles: number;
  readingLogs: number;
  bookLists: number;
  bookListItems: number;
  purchaseLinks: number;
  readingGoals: number;
  readingGoalItems: number;
}

export interface BackupFileMetadata {
  uri: string;
  name: string;
  size: number | null;
  createdAt: number | null;
  modifiedAt: number | null;
}

export interface RestoreBackupResult {
  restoredAt: number;
  safetyBackupUri: string | null;
  counts: BackupCounts;
}
