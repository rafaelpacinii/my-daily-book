import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { BackupData } from '@/src/domain/backup';
import { createBackupFileName } from '@/src/infrastructure/backup/backup-file-names';
import {
  calculateBackupChecksumWithDigest,
  canonicalStringify,
} from '@/src/infrastructure/backup/backup-canonical';

describe('backup serialization helpers', () => {
  it('serializes deterministically and preserves null', () => {
    const left = canonicalStringify({ b: null, a: [{ d: 1, c: null }] });
    const right = canonicalStringify({ a: [{ c: null, d: 1 }], b: null });

    assert.equal(left, right);
    assert.ok(left.includes('"c":null'));
    assert.equal(left.includes('undefined'), false);
  });

  it('creates safe backup file names', () => {
    assert.equal(
      createBackupFileName('2026-06-14T20:30:00.000Z'),
      'my-daily-book-backup-2026-06-14T20-30-00-000Z.mdb-backup.json',
    );
  });

  it('produces stable checksum input and changes when data changes', async () => {
    const digest = async (value: string) => `digest:${value}`;
    const left = await calculateBackupChecksumWithDigest(emptyData({ authors: [] }), digest);
    const right = await calculateBackupChecksumWithDigest(emptyData({ authors: [] }), digest);
    const changed = await calculateBackupChecksumWithDigest(
      emptyData({ authors: [{ id: 'a1', name: 'A', createdAt: 1, updatedAt: 1 }] }),
      digest,
    );

    assert.equal(left, right);
    assert.notEqual(left, changed);
  });
});

function emptyData(partial: Partial<BackupData>): BackupData {
  return {
    authors: [],
    works: [],
    workAuthors: [],
    editions: [],
    coverAssets: [],
    libraryBooks: [],
    bookCopies: [],
    readingCycles: [],
    readingLogs: [],
    bookLists: [],
    bookListItems: [],
    purchaseLinks: [],
    readingGoals: [],
    readingGoalItems: [],
    ...partial,
  };
}
