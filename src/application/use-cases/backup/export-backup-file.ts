import type { BackupFileMetadata } from '@/src/domain/backup';
import {
  serializeBackupFile,
  writeBackupFile,
} from '@/src/infrastructure/backup';
import { createBackupFileName } from '@/src/infrastructure/backup/backup-file-names';

import { createLocalBackup } from './create-local-backup';

export interface ExportBackupFileInput {
  overwrite?: boolean;
  exportedAt?: string;
}

export async function exportBackupFile(input: ExportBackupFileInput = {}): Promise<BackupFileMetadata> {
  const backup = await createLocalBackup({ exportedAt: input.exportedAt });

  return writeBackupFile(
    createBackupFileName(backup.manifest.exportedAt),
    serializeBackupFile(backup),
    input.overwrite ?? false,
  );
}
