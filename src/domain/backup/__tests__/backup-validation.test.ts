import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BACKUP_APPLICATION_NAME,
  BackupChecksumError,
  BackupValidationError,
  UnsupportedBackupVersionError,
  validateBackupFile,
  type BackupData,
  type BackupFile,
} from '@/src/domain/backup';

describe('backup validation', () => {
  it('accepts a valid backup', async () => {
    const backup = sampleBackup();
    await assert.doesNotReject(() => validateBackupFile(backup, async () => backup.checksum));
  });

  it('rejects invalid app, unsupported versions and checksum mismatch', async () => {
    await assert.rejects(
      () => validateBackupFile({ ...sampleBackup(), manifest: { ...sampleBackup().manifest, application: 'Other' as typeof BACKUP_APPLICATION_NAME } }, async () => 'ok'),
      BackupValidationError,
    );
    await assert.rejects(
      () => validateBackupFile({ ...sampleBackup(), manifest: { ...sampleBackup().manifest, formatVersion: 999 } }, async () => 'ok'),
      UnsupportedBackupVersionError,
    );
    await assert.rejects(() => validateBackupFile(sampleBackup(), async () => 'changed'), BackupChecksumError);
  });

  it('rejects duplicates, invalid foreign keys, enums and dates', async () => {
    await assert.rejects(
      () => validateBackupFile(withData({ authors: [{ id: 'a1', name: 'A', createdAt: 1, updatedAt: 1 }, { id: 'a1', name: 'B', createdAt: 1, updatedAt: 1 }] }), async () => 'ok'),
      BackupValidationError,
    );
    await assert.rejects(
      () => validateBackupFile(withData({ editions: [{ id: 'e1', workId: 'missing', metadataSource: 'google_books', externalMetadataId: 'g', googleBooksId: 'g', googleBooksEtag: null, title: 'T', subtitle: null, description: null, publisher: null, publishedDate: null, pageCount: null, language: null, printType: null, isbn10: null, isbn13: null, thumbnailUrl: null, smallThumbnailUrl: null, coverSource: 'none', coverMimeType: null, coverFileName: null, coverUrl: null, previewLink: null, infoLink: null, canonicalVolumeLink: null, metadataFetchedAt: 1, createdAt: 1, updatedAt: 1 }] }), async () => 'ok'),
      BackupValidationError,
    );
    await assert.rejects(
      () => validateBackupFile(invalidBackup({ libraryBooks: [{ id: 'l1', workId: 'w1', status: 'bad', rating: null, notes: null, addedAt: 1, createdAt: 1, updatedAt: 1 }] }), async () => 'ok'),
      BackupValidationError,
    );
    await assert.rejects(
      () => validateBackupFile(withData({ readingLogs: [{ id: 'rl1', readingCycleId: 'rc1', readingDate: 'bad', startPage: 1, endPage: 2, durationSeconds: null, notes: null, createdAt: 1, updatedAt: 1 }] }), async () => 'ok'),
      BackupValidationError,
    );
    await assert.rejects(
      () => validateBackupFile(withData({
        editions: [{
          ...sampleData().editions[0],
          metadataSource: 'brasil_api',
          externalMetadataId: 'brasil-api:isbn:9788545702870',
          googleBooksId: 'should-not-exist',
        }],
      }), async () => 'ok'),
      BackupValidationError,
    );
  });
});

function withData(partial: Partial<BackupData>): BackupFile {
  return { ...sampleBackup(), data: { ...sampleData(), ...partial } };
}

function invalidBackup(partial: Record<string, unknown>): BackupFile {
  return {
    ...sampleBackup(),
    data: Object.assign(sampleData(), partial) as BackupData,
  };
}

function sampleBackup(): BackupFile {
  return {
    manifest: {
      application: BACKUP_APPLICATION_NAME,
      formatVersion: 1,
      schemaVersion: 3,
      exportedAt: '2026-06-14T20:30:00.000Z',
      platform: 'unknown',
      applicationVersion: '1.0.0',
    },
    data: sampleData(),
    checksum: 'ok',
  };
}

function sampleData(): BackupData {
  return {
    authors: [{ id: 'a1', name: 'A', createdAt: 1, updatedAt: 1 }],
    works: [{ id: 'w1', title: 'T', originalTitle: null, description: null, originalLanguage: null, firstPublishedDate: null, createdAt: 1, updatedAt: 1 }],
    workAuthors: [{ workId: 'w1', authorId: 'a1', position: 0 }],
    editions: [{ id: 'e1', workId: 'w1', metadataSource: 'google_books', externalMetadataId: 'g1', googleBooksId: 'g1', googleBooksEtag: null, title: 'T', subtitle: null, description: null, publisher: null, publishedDate: '2026', pageCount: null, language: null, printType: null, isbn10: null, isbn13: null, thumbnailUrl: null, smallThumbnailUrl: null, coverSource: 'none', coverMimeType: null, coverFileName: null, coverUrl: null, previewLink: null, infoLink: null, canonicalVolumeLink: null, metadataFetchedAt: 1, createdAt: 1, updatedAt: 1 }],
    coverAssets: [],
    libraryBooks: [{ id: 'l1', workId: 'w1', status: 'to_read', rating: null, notes: null, addedAt: 1, createdAt: 1, updatedAt: 1 }],
    bookCopies: [{ id: 'bc1', libraryBookId: 'l1', editionId: 'e1', format: 'physical', label: null, notes: null, acquiredAt: null, createdAt: 1, updatedAt: 1 }],
    readingCycles: [{ id: 'rc1', libraryBookId: 'l1', editionId: 'e1', bookCopyId: 'bc1', cycleNumber: 1, status: 'reading', startedAt: '2026-06-14', finishedAt: null, droppedAt: null, lastReadAt: null, rating: null, notes: null, createdAt: 1, updatedAt: 1 }],
    readingLogs: [{ id: 'rl1', readingCycleId: 'rc1', readingDate: '2026-06-14', startPage: 1, endPage: 2, durationSeconds: null, notes: null, createdAt: 1, updatedAt: 1 }],
    bookLists: [{ id: 'bl1', name: 'List', description: null, type: 'custom', createdAt: 1, updatedAt: 1 }],
    bookListItems: [{ id: 'bli1', bookListId: 'bl1', workId: 'w1', editionId: 'e1', position: 0, notes: null, wishlistPriority: null, desiredFormat: null, targetPrice: null, targetCurrency: null, addedAt: 1, createdAt: 1, updatedAt: 1 }],
    purchaseLinks: [{ id: 'p1', bookListItemId: 'bli1', storeName: null, url: 'https://example.com', price: null, currency: null, notes: null, lastCheckedAt: null, createdAt: 1, updatedAt: 1 }],
    readingGoals: [{ id: 'rg1', name: 'Goal', description: null, startDate: '2026-01-01', targetDate: '2026-12-31', status: 'active', completedAt: null, createdAt: 1, updatedAt: 1 }],
    readingGoalItems: [{ id: 'rgi1', readingGoalId: 'rg1', libraryBookId: 'l1', position: 0, completedAt: null, addedAt: 1, createdAt: 1, updatedAt: 1 }],
  };
}
