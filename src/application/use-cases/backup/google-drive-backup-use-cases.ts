import {
  BackupValidationError,
  MAX_BACKUP_FILE_SIZE_BYTES,
  type BackupFile,
  type BackupFileMetadata,
  type RestoreBackupResult,
} from '@/src/domain/backup';
import {
  GoogleDriveClient,
  clearAuthSession,
  connectGoogleDrive,
  disconnectGoogleDrive,
  getGoogleDriveConnectionStatus,
  requireGoogleAccessToken,
  type DriveBackupMetadata,
  type DriveListBackupsResult,
} from '@/src/infrastructure/google-drive';
import {
  parseBackupJson,
  readBackupFile,
  serializeBackupFile,
  writeBackupFile,
} from '@/src/infrastructure/backup';
import { createBackupFileName } from '@/src/infrastructure/backup/backup-file-names';

import { createLocalBackup } from './create-local-backup';
import { restoreBackup } from './restore-backup';
import { validateBackupFile } from './validate-backup';

export { clearAuthSession, connectGoogleDrive, disconnectGoogleDrive, getGoogleDriveConnectionStatus };

export interface UploadBackupToDriveInput {
  localBackupUri?: string;
  createNewBackup?: boolean;
  signal?: AbortSignal;
}

export async function uploadBackupToDrive(
  input: UploadBackupToDriveInput = {},
  client = new GoogleDriveClient(),
): Promise<DriveBackupMetadata> {
  if (input.localBackupUri && input.createNewBackup) {
    throw new BackupValidationError('Choose either localBackupUri or createNewBackup, not both.');
  }

  const accessToken = await requireGoogleAccessToken();
  const backup = input.localBackupUri
    ? parseBackupJson(await readBackupFile(input.localBackupUri))
    : await createLocalBackup();
  await validateBackupFile(backup);

  return client.uploadBackup({
    accessToken,
    name: createBackupFileName(backup.manifest.exportedAt),
    content: serializeBackupFile(backup),
    exportedAt: backup.manifest.exportedAt,
    signal: input.signal,
  });
}

export async function listDriveBackups(
  input: { pageToken?: string | null; signal?: AbortSignal } = {},
  client = new GoogleDriveClient(),
): Promise<DriveListBackupsResult> {
  return client.listBackups({
    accessToken: await requireGoogleAccessToken(),
    pageToken: input.pageToken,
    signal: input.signal,
  });
}

export async function downloadDriveBackup(
  input: { fileId: string; signal?: AbortSignal },
  client = new GoogleDriveClient(),
): Promise<BackupFile> {
  const content = await client.downloadBackup({
    accessToken: await requireGoogleAccessToken(),
    fileId: input.fileId,
    signal: input.signal,
  });

  if (new TextEncoder().encode(content).byteLength > MAX_BACKUP_FILE_SIZE_BYTES) {
    throw new BackupValidationError('Downloaded backup is larger than the supported limit.');
  }

  const backup = parseBackupJson(content);
  await validateBackupFile(backup);

  return backup;
}

export async function deleteDriveBackup(
  input: { fileId: string; signal?: AbortSignal },
  client = new GoogleDriveClient(),
): Promise<void> {
  await client.deleteBackup({
    accessToken: await requireGoogleAccessToken(),
    fileId: input.fileId,
    signal: input.signal,
  });
}

export async function restoreDriveBackup(
  input: { fileId: string; createSafetyBackup?: boolean; signal?: AbortSignal },
  client = new GoogleDriveClient(),
): Promise<RestoreBackupResult> {
  const backup = await downloadDriveBackup(input, client);

  return restoreBackup({
    backup,
    strategy: 'replace',
    createSafetyBackup: input.createSafetyBackup,
  });
}

export async function downloadDriveBackupToLocalFile(
  input: { fileId: string; signal?: AbortSignal },
  client = new GoogleDriveClient(),
): Promise<BackupFileMetadata> {
  const backup = await downloadDriveBackup(input, client);

  return writeBackupFile(createBackupFileName(backup.manifest.exportedAt), serializeBackupFile(backup));
}
