import type { ThemeMode } from '@/src/theme';

export type DriveConnectionState =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'authentication_required'
  | 'error';

export interface LocalBackupViewModel {
  uri: string;
  name: string;
  createdDateLabel: string;
  sizeLabel: string;
}

export interface DriveBackupViewModel {
  id: string;
  name: string;
  dateLabel: string;
  sizeLabel: string;
  formatVersionLabel: string;
  schemaVersionLabel: string;
}

export interface BackupSummaryViewModel {
  title: string;
  exportedAtLabel: string;
  formatVersionLabel: string;
  schemaVersionLabel: string;
  countsLabel: string;
}

export interface ApplicationInfoViewModel {
  appName: string;
  version: string;
  buildNumber: string;
  databaseSchemaVersion: string;
  backupFormatVersion: string;
  privacyNote: string;
}

export interface SettingsViewModel {
  appearance: {
    selectedMode: ThemeMode;
    resolvedMode: 'light' | 'dark';
  };
  localBackups: LocalBackupViewModel[];
  drive: {
    state: DriveConnectionState;
    statusLabel: string;
    expiresAtLabel: string | null;
    backups: DriveBackupViewModel[];
  };
  application: ApplicationInfoViewModel;
}

