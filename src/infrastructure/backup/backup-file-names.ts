import { BACKUP_FILE_EXTENSION, BackupValidationError } from '@/src/domain/backup';

export function createBackupFileName(exportedAt: string): string {
  const safeTimestamp = exportedAt.replace(/[:.]/g, '-');
  return `my-daily-book-backup-${safeTimestamp}${BACKUP_FILE_EXTENSION}`;
}

export function validateBackupFileName(fileName: string): string {
  if (
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName.includes('..') ||
    !fileName.endsWith(BACKUP_FILE_EXTENSION)
  ) {
    throw new BackupValidationError('Backup file name is invalid.');
  }

  return fileName;
}
