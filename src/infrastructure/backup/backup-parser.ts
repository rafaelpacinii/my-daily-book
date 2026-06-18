import {
  BackupSerializationError,
  MAX_BACKUP_FILE_SIZE_BYTES,
  type BackupFile,
} from '@/src/domain/backup';

export function parseBackupJson(content: string): BackupFile {
  if (new TextEncoder().encode(content).byteLength > MAX_BACKUP_FILE_SIZE_BYTES) {
    throw new BackupSerializationError('Backup file is larger than the supported limit.');
  }

  try {
    return JSON.parse(content) as BackupFile;
  } catch (error) {
    throw new BackupSerializationError('Backup file is not valid JSON.', { cause: error });
  }
}

