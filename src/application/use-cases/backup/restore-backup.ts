import type { BackupFile, RestoreBackupResult, RestoreStrategy } from '@/src/domain/backup';
import { BackupRestoreError, validateBackupFile } from '@/src/domain/backup';
import { calculateBackupChecksum, replaceDatabaseWithBackup } from '@/src/infrastructure/backup';

import { exportBackupFile } from './export-backup-file';

export interface RestoreBackupInput {
  backup: BackupFile;
  strategy: RestoreStrategy;
  createSafetyBackup?: boolean;
}

let restoreInProgress = false;

export async function restoreBackup(input: RestoreBackupInput): Promise<RestoreBackupResult> {
  if (restoreInProgress) {
    throw new BackupRestoreError('A restore operation is already running.');
  }

  if (input.strategy !== 'replace') {
    throw new BackupRestoreError('Only replace restore strategy is implemented.');
  }

  restoreInProgress = true;

  try {
    await validateBackupFile(input.backup, calculateBackupChecksum);
    const safetyBackup = input.createSafetyBackup === false ? null : await exportBackupFile();

    return replaceDatabaseWithBackup(input.backup.data, Date.now(), safetyBackup?.uri ?? null);
  } finally {
    restoreInProgress = false;
  }
}
