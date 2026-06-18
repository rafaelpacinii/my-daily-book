import {
  CURRENT_BACKUP_FORMAT_VERSION,
  CURRENT_DATABASE_SCHEMA_VERSION,
} from '@/src/domain/backup';

import {
  GoogleDriveAbortError,
  GoogleDriveFileNotFoundError,
  GoogleDriveHttpError,
  GoogleDriveInvalidResponseError,
  GoogleDriveNetworkError,
  GoogleDriveQuotaError,
} from './google-drive-errors';
import { mapDriveFileMetadata } from './google-drive-mappers';
import {
  GOOGLE_DRIVE_BACKUP_MIME_TYPE,
  type DriveBackupMetadata,
  type DriveListBackupsResult,
} from './google-drive-types';

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export class GoogleDriveClient {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async uploadBackup(input: {
    accessToken: string;
    name: string;
    content: string;
    exportedAt: string;
    signal?: AbortSignal;
  }): Promise<DriveBackupMetadata> {
    const boundary = `mdb-${Date.now()}`;
    const metadata = {
      name: input.name,
      parents: ['appDataFolder'],
      mimeType: GOOGLE_DRIVE_BACKUP_MIME_TYPE,
      appProperties: {
        application: 'my-daily-book',
        backupFormatVersion: String(CURRENT_BACKUP_FORMAT_VERSION),
        schemaVersion: String(CURRENT_DATABASE_SCHEMA_VERSION),
        createdAt: input.exportedAt,
      },
    };
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${GOOGLE_DRIVE_BACKUP_MIME_TYPE}; charset=UTF-8`,
      '',
      input.content,
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const response = await this.request(
      `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,createdTime,modifiedTime,size,appProperties`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
        signal: input.signal,
      },
    );
    const metadataResult = mapDriveFileMetadata(await parseJsonResponse(response));

    if (!metadataResult) {
      throw new GoogleDriveHttpError('Google Drive upload response is invalid.', response.status);
    }

    return metadataResult;
  }

  async listBackups(input: {
    accessToken: string;
    pageToken?: string | null;
    signal?: AbortSignal;
  }): Promise<DriveListBackupsResult> {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'nextPageToken,files(id,name,createdTime,modifiedTime,size,appProperties)',
      orderBy: 'modifiedTime desc',
      q: "appProperties has { key='application' and value='my-daily-book' } and trashed=false",
    });

    if (input.pageToken) {
      params.set('pageToken', input.pageToken);
    }

    const response = await this.request(`${DRIVE_BASE_URL}/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${input.accessToken}` },
      signal: input.signal,
    });
    const data = await parseJsonResponse(response);
    const files = Array.isArray(data.files) ? data.files : [];

    return {
      nextPageToken: typeof data.nextPageToken === 'string' ? data.nextPageToken : null,
      items: files.flatMap((file) => {
        if (!isRecord(file)) return [];
        const metadata = mapDriveFileMetadata(file);
        return metadata ? [metadata] : [];
      }),
    };
  }

  async downloadBackup(input: {
    accessToken: string;
    fileId: string;
    signal?: AbortSignal;
  }): Promise<string> {
    const response = await this.request(
      `${DRIVE_BASE_URL}/files/${encodeURIComponent(input.fileId)}?alt=media`,
      {
        headers: { Authorization: `Bearer ${input.accessToken}` },
        signal: input.signal,
      },
    );

    return response.text();
  }

  async deleteBackup(input: {
    accessToken: string;
    fileId: string;
    signal?: AbortSignal;
  }): Promise<void> {
    await this.request(`${DRIVE_BASE_URL}/files/${encodeURIComponent(input.fileId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${input.accessToken}` },
      signal: input.signal,
    });
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      const response = await this.fetchFn(url, init);

      if (!response.ok) {
        throw createDriveHttpError(response.status);
      }

      return response;
    } catch (error) {
      if (error instanceof GoogleDriveHttpError) {
        throw error;
      }

      if (isAbortError(error)) {
        throw new GoogleDriveAbortError('Google Drive request was cancelled.', { cause: error });
      }

      throw new GoogleDriveNetworkError('Google Drive network request failed.', { cause: error });
    }
  }
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    const data = await response.json();

    if (!isRecord(data)) {
      throw new GoogleDriveInvalidResponseError('Google Drive response is invalid.', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof GoogleDriveInvalidResponseError) {
      throw error;
    }

    throw new GoogleDriveInvalidResponseError('Google Drive response is invalid.', response.status, { cause: error });
  }
}

function createDriveHttpError(status: number): GoogleDriveHttpError {
  if (status === 404) return new GoogleDriveFileNotFoundError('Google Drive backup was not found.', status);
  if (status === 429) return new GoogleDriveQuotaError('Google Drive quota was exceeded.', status);
  return new GoogleDriveHttpError('Google Drive request failed.', status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (
    isRecord(error) && error.name === 'AbortError'
  );
}
