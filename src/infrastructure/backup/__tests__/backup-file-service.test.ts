import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BackupValidationError } from '@/src/domain/backup';
import { validateBackupFileName } from '@/src/infrastructure/backup/backup-file-names';

describe('backup file service guards', () => {
  it('accepts expected extension and rejects path traversal', () => {
    assert.equal(validateBackupFileName('safe.mdb-backup.json'), 'safe.mdb-backup.json');
    assert.throws(() => validateBackupFileName('../unsafe.mdb-backup.json'), BackupValidationError);
    assert.throws(() => validateBackupFileName('unsafe.json'), BackupValidationError);
  });
});
