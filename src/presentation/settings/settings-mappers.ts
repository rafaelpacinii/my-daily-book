import { i18n } from '@/src/localization/i18n';
import {
  formatBackupCounts,
  formatFileSize,
  formatIsoTimestamp,
  formatOptionalVersion,
  formatTimestamp,
} from './settings-formatters';
import type {
  BackupSummaryViewModel,
  DriveBackupViewModel,
  DriveConnectionState,
  LocalBackupViewModel,
} from './settings-types';

export interface BackupFileMetadataResult {
  uri: string;
  name: string;
  size: number | null;
  createdAt: number | null;
  modifiedAt: number | null;
}

export interface DriveConnectionStatusResult {
  connected: boolean;
  expiresAt: number | null;
}

export interface DriveBackupMetadataResult {
  id: string;
  name: string;
  createdTime: string | null;
  modifiedTime: string | null;
  size: number | null;
  formatVersion: number | null;
  schemaVersion: number | null;
}

export interface BackupFileSummaryResult {
  manifest: {
    exportedAt: string;
    formatVersion: number;
    schemaVersion: number;
  };
  data: {
    authors: unknown[];
    works: unknown[];
    workAuthors: unknown[];
    editions: unknown[];
    libraryBooks: unknown[];
    bookCopies: unknown[];
    readingCycles: unknown[];
    readingLogs: unknown[];
    bookLists: unknown[];
    bookListItems: unknown[];
    purchaseLinks: unknown[];
    readingGoals: unknown[];
    readingGoalItems: unknown[];
  };
}

export interface RestoreBackupResultSummary {
  safetyBackupUri: string | null;
  counts: Parameters<typeof formatBackupCounts>[0];
}

export function mapLocalBackup(metadata: BackupFileMetadataResult): LocalBackupViewModel {
  return {
    uri: metadata.uri,
    name: metadata.name,
    createdDateLabel: formatTimestamp(metadata.modifiedAt ?? metadata.createdAt),
    sizeLabel: formatFileSize(metadata.size),
  };
}

export function mapDriveConnectionState(
  status: DriveConnectionStatusResult | null,
  transient: 'connecting' | null,
  error: unknown,
): DriveConnectionState {
  if (transient === 'connecting') return 'connecting';
  if (error && errorName(error).includes('AuthRequired')) return 'authentication_required';
  if (error) return 'error';
  return status?.connected ? 'connected' : 'not_connected';
}

export function mapDriveStatusLabel(state: DriveConnectionState): string {
  if (state === 'connecting') return t('settings.drive.connecting');
  if (state === 'connected') return t('settings.drive.connected');
  if (state === 'authentication_required') return t('settings.drive.authenticationRequired');
  if (state === 'error') return t('settings.drive.error');
  return t('settings.drive.notConnected');
}

export function mapDriveBackup(metadata: DriveBackupMetadataResult): DriveBackupViewModel {
  return {
    id: metadata.id,
    name: metadata.name,
    dateLabel: formatIsoTimestamp(metadata.modifiedTime ?? metadata.createdTime),
    sizeLabel: formatFileSize(metadata.size),
    formatVersionLabel: formatOptionalVersion(metadata.formatVersion),
    schemaVersionLabel: formatOptionalVersion(metadata.schemaVersion),
  };
}

export function mapBackupSummary(backup: BackupFileSummaryResult, title = t('settings.backup.readyTitle')): BackupSummaryViewModel {
  return {
    title,
    exportedAtLabel: formatIsoTimestamp(backup.manifest.exportedAt),
    formatVersionLabel: String(backup.manifest.formatVersion),
    schemaVersionLabel: String(backup.manifest.schemaVersion),
    countsLabel: formatBackupCounts({
      authors: backup.data.authors.length,
      works: backup.data.works.length,
      workAuthors: backup.data.workAuthors.length,
      editions: backup.data.editions.length,
      libraryBooks: backup.data.libraryBooks.length,
      bookCopies: backup.data.bookCopies.length,
      readingCycles: backup.data.readingCycles.length,
      readingLogs: backup.data.readingLogs.length,
      bookLists: backup.data.bookLists.length,
      bookListItems: backup.data.bookListItems.length,
      purchaseLinks: backup.data.purchaseLinks.length,
      readingGoals: backup.data.readingGoals.length,
      readingGoalItems: backup.data.readingGoalItems.length,
    }),
  };
}

export function mapRestoreResult(result: RestoreBackupResultSummary): string {
  return t('settings.backup.restoreComplete', {
    counts: formatBackupCounts(result.counts),
    safety: result.safetyBackupUri ? t('settings.backup.safetyCreated') : '',
  });
}

export function mapSettingsError(error: unknown): string {
  const name = errorName(error);
  const message = error instanceof Error ? error.message : '';

  if (name.includes('Cancelled')) return t('settings.errors.cancelled');
  if (name.includes('Configuration')) return t('settings.errors.driveNotConfigured');
  if (name.includes('Environment')) return t('settings.errors.driveEnvironment');
  if (name.includes('Timeout')) return t('settings.errors.timeout');
  if (name.includes('AuthRequired') || message.toLowerCase().includes('authorization')) return t('settings.errors.authRequired');
  if (name.includes('Quota') || message.includes('429')) return t('settings.errors.quota');
  if (name.includes('FileNotFound') || message.includes('404')) return t('settings.errors.notFound');
  if (name.includes('Checksum')) return t('settings.errors.checksum');
  if (name.includes('Unsupported')) return t('settings.errors.unsupported');
  if (name.includes('Validation')) return message || t('settings.errors.invalidBackup');
  if (name.includes('Restore')) return t('settings.errors.restore');
  if (name.includes('Network')) return t('settings.errors.network');
  if (message.includes('Sharing is not available')) return t('settings.errors.sharingUnavailable');

  return t('settings.errors.generic');
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : '';
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
