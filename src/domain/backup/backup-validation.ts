import {
  BACKUP_APPLICATION_NAME,
  CURRENT_BACKUP_FORMAT_VERSION,
  CURRENT_DATABASE_SCHEMA_VERSION,
  type BackupData,
  type BackupFile,
} from './backup-types';
import {
  BackupChecksumError,
  BackupValidationError,
  UnsupportedBackupVersionError,
} from './backup-errors';

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const ISO_DATE_PATTERN = /^\d{4}(-\d{2})?(-\d{2})?$/;

export type BackupChecksumFunction = (data: BackupData) => Promise<string>;

export async function validateBackupFile(
  backup: BackupFile,
  checksum: BackupChecksumFunction,
): Promise<void> {
  validateBackupShape(backup);

  const actualChecksum = await checksum(backup.data);

  if (actualChecksum !== backup.checksum) {
    throw new BackupChecksumError('Backup checksum does not match its data.');
  }
}

export function validateBackupShape(backup: BackupFile): void {
  if (!isRecord(backup) || !isRecord(backup.manifest) || !isRecord(backup.data)) {
    throw new BackupValidationError('Backup root object is invalid.');
  }

  if (typeof backup.checksum !== 'string' || backup.checksum.length === 0) {
    throw new BackupValidationError('Backup checksum is required.');
  }

  if (backup.manifest.application !== BACKUP_APPLICATION_NAME) {
    throw new BackupValidationError('Backup application is not supported.');
  }

  if (backup.manifest.formatVersion > CURRENT_BACKUP_FORMAT_VERSION) {
    throw new UnsupportedBackupVersionError('Backup format version is newer than this app supports.');
  }

  if (backup.manifest.formatVersion !== CURRENT_BACKUP_FORMAT_VERSION) {
    throw new UnsupportedBackupVersionError('Backup format version is not supported.');
  }

  if (backup.manifest.schemaVersion !== CURRENT_DATABASE_SCHEMA_VERSION) {
    throw new UnsupportedBackupVersionError('Backup schema version is not supported.');
  }

  if (!ISO_TIMESTAMP_PATTERN.test(backup.manifest.exportedAt)) {
    throw new BackupValidationError('Backup exportedAt must be an ISO timestamp.');
  }

  validateBackupData(backup.data);
}

export function countBackupData(data: BackupData) {
  return {
    authors: data.authors.length,
    works: data.works.length,
    workAuthors: data.workAuthors.length,
    editions: data.editions.length,
    coverAssets: data.coverAssets.length,
    libraryBooks: data.libraryBooks.length,
    bookCopies: data.bookCopies.length,
    readingCycles: data.readingCycles.length,
    readingLogs: data.readingLogs.length,
    bookLists: data.bookLists.length,
    bookListItems: data.bookListItems.length,
    purchaseLinks: data.purchaseLinks.length,
    readingGoals: data.readingGoals.length,
    readingGoalItems: data.readingGoalItems.length,
  };
}

function validateBackupData(data: BackupData): void {
  const collections = [
    data.authors,
    data.works,
    data.workAuthors,
    data.editions,
    data.coverAssets,
    data.libraryBooks,
    data.bookCopies,
    data.readingCycles,
    data.readingLogs,
    data.bookLists,
    data.bookListItems,
    data.purchaseLinks,
    data.readingGoals,
    data.readingGoalItems,
  ];

  if (collections.some((collection) => !Array.isArray(collection))) {
    throw new BackupValidationError('Backup is missing a required collection.');
  }

  assertUniqueIds('authors', data.authors);
  assertUniqueIds('works', data.works);
  assertUniqueIds('editions', data.editions);
  assertUniqueIds('libraryBooks', data.libraryBooks);
  assertUniqueIds('bookCopies', data.bookCopies);
  assertUniqueIds('readingCycles', data.readingCycles);
  assertUniqueIds('readingLogs', data.readingLogs);
  assertUniqueIds('bookLists', data.bookLists);
  assertUniqueIds('bookListItems', data.bookListItems);
  assertUniqueIds('purchaseLinks', data.purchaseLinks);
  assertUniqueIds('readingGoals', data.readingGoals);
  assertUniqueIds('readingGoalItems', data.readingGoalItems);

  const authors = idSet(data.authors);
  const works = idSet(data.works);
  const editions = idSet(data.editions);
  const libraryBooks = idSet(data.libraryBooks);
  const bookCopies = idSet(data.bookCopies);
  const readingCycles = idSet(data.readingCycles);
  const bookLists = idSet(data.bookLists);
  const bookListItems = idSet(data.bookListItems);
  const readingGoals = idSet(data.readingGoals);

  data.workAuthors.forEach((row) => {
    assertReference(authors, row.authorId, 'workAuthors.authorId');
    assertReference(works, row.workId, 'workAuthors.workId');
  });
  data.editions.forEach((row) => {
    assertReference(works, row.workId, 'editions.workId');
    assertEnum(row.metadataSource, ['google_books', 'brasil_api', 'manual'], 'editions.metadataSource');
    if (row.metadataSource !== 'manual' && (typeof row.externalMetadataId !== 'string' || row.externalMetadataId.trim().length === 0)) {
      throw new BackupValidationError('editions.externalMetadataId is required.');
    }
    if (row.metadataSource === 'manual' && row.externalMetadataId != null && row.externalMetadataId.trim().length > 0) {
      throw new BackupValidationError('editions.externalMetadataId must be null for manual metadata.');
    }
    if (row.metadataSource !== 'google_books' && row.googleBooksId != null) {
      throw new BackupValidationError('editions.googleBooksId is only valid for Google Books metadata.');
    }
    assertEnum(row.coverSource, ['remote', 'local', 'none'], 'editions.coverSource');
    if (row.coverSource === 'local' && (!row.coverUrl || !row.coverMimeType || !row.coverFileName)) {
      throw new BackupValidationError('Local edition covers must include file metadata.');
    }
    if (row.coverSource === 'none' && row.coverUrl != null) {
      throw new BackupValidationError('editions.coverUrl must be null when coverSource is none.');
    }
  });
  data.coverAssets.forEach((row) => {
    assertReference(editions, row.editionId, 'coverAssets.editionId');
    if (typeof row.fileName !== 'string' || row.fileName.trim().length === 0) {
      throw new BackupValidationError('coverAssets.fileName is required.');
    }
    if (typeof row.mimeType !== 'string' || row.mimeType.trim().length === 0) {
      throw new BackupValidationError('coverAssets.mimeType is required.');
    }
    if (typeof row.base64 !== 'string' || row.base64.trim().length === 0) {
      throw new BackupValidationError('coverAssets.base64 is required.');
    }
  });
  data.libraryBooks.forEach((row) => {
    assertReference(works, row.workId, 'libraryBooks.workId');
    assertEnum(row.status, ['to_read', 'reading', 'read', 'dropped'], 'libraryBooks.status');
  });
  data.bookCopies.forEach((row) => {
    assertReference(libraryBooks, row.libraryBookId, 'bookCopies.libraryBookId');
    assertReference(editions, row.editionId, 'bookCopies.editionId');
    assertEnum(row.format, ['physical', 'digital'], 'bookCopies.format');
  });
  data.readingCycles.forEach((row) => {
    assertReference(libraryBooks, row.libraryBookId, 'readingCycles.libraryBookId');
    assertReference(editions, row.editionId, 'readingCycles.editionId');
    if (row.bookCopyId) assertReference(bookCopies, row.bookCopyId, 'readingCycles.bookCopyId');
    assertEnum(row.status, ['reading', 'completed', 'dropped'], 'readingCycles.status');
    assertDate(row.startedAt, 'readingCycles.startedAt');
  });
  data.readingLogs.forEach((row) => {
    assertReference(readingCycles, row.readingCycleId, 'readingLogs.readingCycleId');
    assertDate(row.readingDate, 'readingLogs.readingDate');
    if (row.startPage < 1 || row.endPage < row.startPage) {
      throw new BackupValidationError('readingLogs page range is invalid.');
    }
  });
  data.bookLists.forEach((row) => assertEnum(row.type, ['custom', 'wishlist'], 'bookLists.type'));
  data.bookListItems.forEach((row) => {
    assertReference(bookLists, row.bookListId, 'bookListItems.bookListId');
    assertReference(works, row.workId, 'bookListItems.workId');
    if (row.editionId) assertReference(editions, row.editionId, 'bookListItems.editionId');
    if (row.wishlistPriority) assertEnum(row.wishlistPriority, ['low', 'medium', 'high'], 'bookListItems.wishlistPriority');
    if (row.desiredFormat) assertEnum(row.desiredFormat, ['physical', 'digital', 'any'], 'bookListItems.desiredFormat');
  });
  data.purchaseLinks.forEach((row) => assertReference(bookListItems, row.bookListItemId, 'purchaseLinks.bookListItemId'));
  data.readingGoals.forEach((row) => {
    assertEnum(row.status, ['active', 'completed', 'cancelled'], 'readingGoals.status');
    assertDate(row.startDate, 'readingGoals.startDate');
    assertDate(row.targetDate, 'readingGoals.targetDate');
  });
  data.readingGoalItems.forEach((row) => {
    assertReference(readingGoals, row.readingGoalId, 'readingGoalItems.readingGoalId');
    assertReference(libraryBooks, row.libraryBookId, 'readingGoalItems.libraryBookId');
  });

  assertCompositeUnique(data.workAuthors, (row) => `${row.workId}:${row.authorId}`, 'workAuthors primary key');
  assertCompositeUnique(data.editions, (row) => `${row.metadataSource}:${row.externalMetadataId}`, 'editions external metadata key');
  assertCompositeUnique(data.coverAssets, (row) => row.editionId, 'coverAssets edition key');
  assertCompositeUnique(data.bookCopies, (row) => `${row.libraryBookId}:${row.editionId}:${row.format}`, 'bookCopies unique key');
  assertCompositeUnique(data.readingCycles, (row) => `${row.libraryBookId}:${row.cycleNumber}`, 'readingCycles unique key');
  assertCompositeUnique(data.bookListItems, (row) => `${row.bookListId}:${row.workId}:${row.editionId ?? ''}`, 'bookListItems unique key');
  assertCompositeUnique(data.readingGoalItems, (row) => `${row.readingGoalId}:${row.libraryBookId}`, 'readingGoalItems unique key');
}

function assertUniqueIds(name: string, rows: { id: string }[]): void {
  rows.forEach((row) => {
    if (typeof row.id !== 'string' || row.id.length === 0) {
      throw new BackupValidationError(`${name} contains an invalid id.`);
    }
  });
  assertCompositeUnique(rows, (row) => row.id, `${name} id`);
}

function assertCompositeUnique<T>(rows: T[], key: (row: T) => string, name: string): void {
  const seen = new Set<string>();

  rows.forEach((row) => {
    const value = key(row);
    if (seen.has(value)) {
      throw new BackupValidationError(`${name} contains duplicates.`);
    }
    seen.add(value);
  });
}

function idSet(rows: { id: string }[]): Set<string> {
  return new Set(rows.map((row) => row.id));
}

function assertReference(ids: Set<string>, value: string, name: string): void {
  if (!ids.has(value)) {
    throw new BackupValidationError(`${name} references a missing row.`);
  }
}

function assertEnum(value: string, values: string[], name: string): void {
  if (!values.includes(value)) {
    throw new BackupValidationError(`${name} is invalid.`);
  }
}

function assertDate(value: string | null, name: string): void {
  if (value != null && !ISO_DATE_PATTERN.test(value)) {
    throw new BackupValidationError(`${name} is invalid.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
