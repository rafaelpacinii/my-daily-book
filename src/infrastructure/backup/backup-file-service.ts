import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import {
  BACKUP_FILE_EXTENSION,
  BackupFileNotFoundError,
  BackupValidationError,
  MAX_BACKUP_FILE_SIZE_BYTES,
  type BackupFileMetadata,
} from '@/src/domain/backup';
import { validateBackupFileName } from './backup-file-names';

export interface PickBackupFileResult {
  cancelled: boolean;
  uri: string | null;
  name: string | null;
  size: number | null;
}

const BACKUP_DIRECTORY = `${FileSystem.documentDirectory ?? ''}backups/`;

export async function writeBackupFile(
  fileName: string,
  content: string,
  overwrite = false,
): Promise<BackupFileMetadata> {
  const safeName = validateBackupFileName(fileName);
  await ensureBackupDirectory();
  const uri = `${BACKUP_DIRECTORY}${safeName}`;
  const info = await FileSystem.getInfoAsync(uri);

  if (info.exists && !overwrite) {
    throw new BackupValidationError('Backup file already exists.');
  }

  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });

  return getBackupFileMetadata(uri, safeName);
}

export async function readBackupFile(uri: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    throw new BackupFileNotFoundError('Backup file was not found.');
  }

  if (info.size != null && info.size > MAX_BACKUP_FILE_SIZE_BYTES) {
    throw new BackupValidationError('Backup file is larger than the supported limit.');
  }

  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function listLocalBackupFiles(): Promise<BackupFileMetadata[]> {
  await ensureBackupDirectory();
  const names = await FileSystem.readDirectoryAsync(BACKUP_DIRECTORY);
  const backupNames = names.filter((name) => name.endsWith(BACKUP_FILE_EXTENSION));
  const files = await Promise.all(
    backupNames.map((name) => getBackupFileMetadata(`${BACKUP_DIRECTORY}${name}`, name)),
  );

  return files.sort((left, right) => (right.modifiedAt ?? 0) - (left.modifiedAt ?? 0));
}

export async function deleteLocalBackup(uri: string): Promise<void> {
  assertUriInsideBackupDirectory(uri);
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    throw new BackupFileNotFoundError('Backup file was not found.');
  }

  await FileSystem.deleteAsync(uri, { idempotent: false });
}

export async function shareLocalBackup(uri: string): Promise<void> {
  assertUriInsideBackupDirectory(uri);

  if (!(await Sharing.isAvailableAsync())) {
    throw new BackupValidationError('Sharing is not available in this environment.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Share My Daily Book backup',
  });
}

export async function pickBackupFile(): Promise<PickBackupFileResult> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: 'application/json',
  });

  if (result.canceled) {
    return { cancelled: true, uri: null, name: null, size: null };
  }

  const asset = result.assets[0];

  return {
    cancelled: false,
    uri: asset?.uri ?? null,
    name: asset?.name ?? null,
    size: asset?.size ?? null,
  };
}

async function ensureBackupDirectory(): Promise<void> {
  await FileSystem.makeDirectoryAsync(BACKUP_DIRECTORY, { intermediates: true });
}

async function getBackupFileMetadata(uri: string, name: string): Promise<BackupFileMetadata> {
  const info = await FileSystem.getInfoAsync(uri);

  return {
    uri,
    name,
    size: info.exists ? (info.size ?? null) : null,
    createdAt: null,
    modifiedAt: info.exists ? (info.modificationTime ?? null) : null,
  };
}

function assertUriInsideBackupDirectory(uri: string): void {
  if (!uri.startsWith(BACKUP_DIRECTORY) || !uri.endsWith(BACKUP_FILE_EXTENSION)) {
    throw new BackupValidationError('Backup file URI is outside the controlled backup directory.');
  }
}
