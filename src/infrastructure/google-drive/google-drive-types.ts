export const GOOGLE_DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
export const GOOGLE_DRIVE_BACKUP_MIME_TYPE = 'application/json';

export interface GoogleAuthSession {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface GoogleDriveConnectionStatus {
  connected: boolean;
  expiresAt: number | null;
}

export interface DriveBackupMetadata {
  id: string;
  name: string;
  createdTime: string | null;
  modifiedTime: string | null;
  size: number | null;
  formatVersion: number | null;
  schemaVersion: number | null;
}

export interface DriveListBackupsResult {
  items: DriveBackupMetadata[];
  nextPageToken: string | null;
}

