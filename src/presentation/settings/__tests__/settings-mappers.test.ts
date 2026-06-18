import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { i18n } from '@/src/localization/i18n';
import {
  mapBackupSummary,
  mapDriveBackup,
  mapDriveConnectionState,
  mapDriveStatusLabel,
  mapLocalBackup,
  mapRestoreResult,
  mapSettingsError,
  type BackupFileSummaryResult,
  type DriveBackupMetadataResult,
  type RestoreBackupResultSummary,
} from '../settings-mappers';

describe('settings mappers', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('maps local backup metadata', () => {
    const backup = mapLocalBackup({
      uri: 'file:///backups/a.mdb-backup.json',
      name: 'a.mdb-backup.json',
      size: 2048,
      createdAt: null,
      modifiedAt: Date.UTC(2026, 5, 16, 12, 0),
    });

    assert.equal(backup.name, 'a.mdb-backup.json');
    assert.equal(backup.sizeLabel, '2.0 KB');
  });

  it('maps Drive connection states and backups', () => {
    assert.equal(mapDriveConnectionState({ connected: false, expiresAt: null }, null, null), 'not_connected');
    assert.equal(mapDriveConnectionState({ connected: true, expiresAt: 1 }, null, null), 'connected');
    assert.equal(mapDriveConnectionState(null, 'connecting', null), 'connecting');
    assert.equal(mapDriveStatusLabel('authentication_required'), 'Authentication required');

    const backup = mapDriveBackup({
      id: 'drive-1',
      name: 'remote.mdb-backup.json',
      createdTime: '2026-06-16T10:00:00.000Z',
      modifiedTime: null,
      size: 1024,
      formatVersion: 1,
      schemaVersion: 1,
    } satisfies DriveBackupMetadataResult);

    assert.equal(backup.id, 'drive-1');
    assert.equal(backup.sizeLabel, '1.0 KB');
    assert.equal(backup.formatVersionLabel, '1');
  });

  it('maps backup summaries and restore results without exposing raw data', () => {
    const summary = mapBackupSummary(sampleBackup());
    const restoreMessage = mapRestoreResult({
      safetyBackupUri: 'file:///safe.mdb-backup.json',
      counts: emptyCounts({ libraryBooks: 2, readingLogs: 5 }),
    } satisfies RestoreBackupResultSummary);

    assert.equal(summary.formatVersionLabel, '1');
    assert.match(summary.countsLabel, /1 book/);
    assert.match(restoreMessage, /safety backup/);
  });

  it('maps safe user-facing error messages', () => {
    class GoogleAuthCancelledError extends Error {
      constructor() {
        super('token redacted');
        this.name = 'GoogleAuthCancelledError';
      }
    }
    class BackupChecksumError extends Error {
      constructor() {
        super('checksum failed');
        this.name = 'BackupChecksumError';
      }
    }
    class GoogleAuthConfigurationError extends Error {
      constructor() {
        super('missing client id');
        this.name = 'GoogleAuthConfigurationError';
      }
    }
    class GoogleAuthEnvironmentError extends Error {
      constructor() {
        super('expo go');
        this.name = 'GoogleAuthEnvironmentError';
      }
    }
    class GoogleAuthTimeoutError extends Error {
      constructor() {
        super('timed out');
        this.name = 'GoogleAuthTimeoutError';
      }
    }

    assert.equal(mapSettingsError(new GoogleAuthCancelledError()), 'The operation was cancelled.');
    assert.equal(mapSettingsError(new GoogleAuthConfigurationError()), 'Google Drive is not configured for this build.');
    assert.equal(mapSettingsError(new GoogleAuthEnvironmentError()), 'Google Drive requires a development or preview build in this environment.');
    assert.equal(mapSettingsError(new GoogleAuthTimeoutError()), 'Google Drive took too long to respond. Please try again.');
    assert.equal(mapSettingsError(new BackupChecksumError()), 'The backup checksum is invalid.');
    assert.equal(mapSettingsError(new Error('Sharing is not available in this environment.')), 'Sharing is not available in this environment.');
  });

  it('localizes mapped labels in pt-BR', async () => {
    await i18n.changeLanguage('pt-BR');

    assert.equal(mapDriveStatusLabel('authentication_required'), 'Autenticação necessária');
    assert.match(mapBackupSummary(sampleBackup()).countsLabel, /1 livro/);
    assert.match(
      mapRestoreResult({
        safetyBackupUri: 'file:///safe.mdb-backup.json',
        counts: emptyCounts({ libraryBooks: 2 }),
      } satisfies RestoreBackupResultSummary),
      /backup de segurança/i,
    );
  });
});

function sampleBackup(): BackupFileSummaryResult {
  return {
    manifest: {
      formatVersion: 1,
      schemaVersion: 1,
      exportedAt: '2026-06-16T10:00:00.000Z',
    },
    data: {
      authors: [],
      works: [],
      workAuthors: [],
      editions: [],
      libraryBooks: [{}],
      bookCopies: [],
      readingCycles: [],
      readingLogs: [],
      bookLists: [],
      bookListItems: [],
      purchaseLinks: [],
      readingGoals: [],
      readingGoalItems: [],
    },
  };
}

function emptyCounts(overrides: Partial<RestoreBackupResultSummary['counts']> = {}): RestoreBackupResultSummary['counts'] {
  return {
    authors: 0,
    works: 0,
    workAuthors: 0,
    editions: 0,
    libraryBooks: 0,
    bookCopies: 0,
    readingCycles: 0,
    readingLogs: 0,
    bookLists: 0,
    bookListItems: 0,
    purchaseLinks: 0,
    readingGoals: 0,
    readingGoalItems: 0,
    ...overrides,
  };
}
