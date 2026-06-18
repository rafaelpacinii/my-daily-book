import type { BackupFile } from '@/src/domain/backup';
import { validateBackupFile as validateBackupDomain } from '@/src/domain/backup';
import { calculateBackupChecksum } from '@/src/infrastructure/backup';

export async function validateBackupFile(backup: BackupFile): Promise<void> {
  await validateBackupDomain(backup, calculateBackupChecksum);
}

