import * as Crypto from 'expo-crypto';

import type { BackupData, BackupFile, BackupManifest, BackupPlatform } from '@/src/domain/backup';
import {
  BACKUP_APPLICATION_NAME,
  CURRENT_BACKUP_FORMAT_VERSION,
  CURRENT_DATABASE_SCHEMA_VERSION,
} from '@/src/domain/backup';
import { calculateBackupChecksumWithDigest, canonicalStringify } from './backup-canonical';

export interface CreateBackupManifestInput {
  data: BackupData;
  exportedAt: string;
  platform: BackupPlatform;
  applicationVersion: string | null;
}

export async function createBackupManifest(input: CreateBackupManifestInput): Promise<BackupManifest> {
  return {
    application: BACKUP_APPLICATION_NAME,
    formatVersion: CURRENT_BACKUP_FORMAT_VERSION,
    schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
    exportedAt: input.exportedAt,
    platform: input.platform,
    applicationVersion: input.applicationVersion,
  };
}

export async function createBackupFile(input: CreateBackupManifestInput): Promise<BackupFile> {
  return {
    manifest: await createBackupManifest(input),
    data: input.data,
    checksum: await calculateBackupChecksum(input.data),
  };
}

export function serializeBackupFile(backup: BackupFile): string {
  return `${canonicalStringify(backup)}\n`;
}

export async function calculateBackupChecksum(data: BackupData): Promise<string> {
  return calculateBackupChecksumWithDigest(data, (value) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
  );
}
