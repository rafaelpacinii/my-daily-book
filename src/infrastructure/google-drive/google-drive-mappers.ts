import type { DriveBackupMetadata } from './google-drive-types';

export function mapDriveFileMetadata(data: Record<string, unknown>): DriveBackupMetadata | null {
  if (typeof data.id !== 'string' || typeof data.name !== 'string') {
    return null;
  }

  const appProperties = isRecord(data.appProperties) ? data.appProperties : {};

  return {
    id: data.id,
    name: data.name,
    createdTime: typeof data.createdTime === 'string' ? data.createdTime : null,
    modifiedTime: typeof data.modifiedTime === 'string' ? data.modifiedTime : null,
    size: typeof data.size === 'string' ? Number(data.size) : null,
    formatVersion: readNumericAppProperty(appProperties.backupFormatVersion),
    schemaVersion: readNumericAppProperty(appProperties.schemaVersion),
  };
}

function readNumericAppProperty(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

