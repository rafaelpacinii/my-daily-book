import type { BackupFile } from '@/src/domain/backup';
import { calculateBackupChecksum, parseBackupJson, readBackupFile } from '@/src/infrastructure/backup';
import { validateBackupFile as validateBackup } from '@/src/domain/backup';

export interface ImportBackupFileInput {
  uri: string;
}

export async function importBackupFile(input: ImportBackupFileInput): Promise<BackupFile> {
  const backup = parseBackupJson(await readBackupFile(input.uri));
  await validateBackup(backup, calculateBackupChecksum);

  return backup;
}

