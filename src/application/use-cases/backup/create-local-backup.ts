import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { BackupFile } from '@/src/domain/backup';
import { createBackupFile, readBackupData } from '@/src/infrastructure/backup';

export interface CreateLocalBackupInput {
  exportedAt?: string;
}

export async function createLocalBackup(input: CreateLocalBackupInput = {}): Promise<BackupFile> {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const data = await readBackupData();

  return createBackupFile({
    data,
    exportedAt,
    platform: Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown',
    applicationVersion: Constants.expoConfig?.version ?? null,
  });
}
