import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  GoogleDriveAbortError,
  GoogleDriveFileNotFoundError,
  GoogleDriveHttpError,
  GoogleDriveInvalidResponseError,
  GoogleDriveQuotaError,
} from '@/src/infrastructure/google-drive/google-drive-errors';
import { GoogleDriveClient } from '@/src/infrastructure/google-drive/google-drive-client';

describe('GoogleDriveClient', () => {
  it('uploads, lists, downloads and deletes backups with auth headers', async () => {
    const calls: string[] = [];
    const client = new GoogleDriveClient(async (url, init) => {
      calls.push(`${init?.method ?? 'GET'} ${String(url)}`);
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer token');

      if (String(url).includes('upload')) {
        return jsonResponse({ id: 'f1', name: 'backup.mdb-backup.json', size: '10', appProperties: { backupFormatVersion: '1', schemaVersion: '1' } });
      }
      if (String(url).includes('alt=media')) {
        return new Response('content');
      }
      if (init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return jsonResponse({ files: [{ id: 'f1', name: 'backup.mdb-backup.json', size: '10', appProperties: { backupFormatVersion: '1', schemaVersion: '1' } }] });
    });

    assert.equal((await client.uploadBackup({ accessToken: 'token', name: 'backup.mdb-backup.json', content: '{}', exportedAt: '2026-01-01T00:00:00.000Z' })).id, 'f1');
    assert.equal((await client.listBackups({ accessToken: 'token' })).items.length, 1);
    assert.equal(await client.downloadBackup({ accessToken: 'token', fileId: 'f1' }), 'content');
    await assert.doesNotReject(() => client.deleteBackup({ accessToken: 'token', fileId: 'f1' }));
    assert.equal(calls.length, 4);
  });

  it('maps Drive HTTP errors', async () => {
    await assert.rejects(() => clientWithStatus(401).listBackups({ accessToken: 'token' }), GoogleDriveHttpError);
    await assert.rejects(() => clientWithStatus(403).listBackups({ accessToken: 'token' }), GoogleDriveHttpError);
    await assert.rejects(() => clientWithStatus(404).downloadBackup({ accessToken: 'token', fileId: 'x' }), GoogleDriveFileNotFoundError);
    await assert.rejects(() => clientWithStatus(429).listBackups({ accessToken: 'token' }), GoogleDriveQuotaError);
    await assert.rejects(() => clientWithStatus(500).listBackups({ accessToken: 'token' }), GoogleDriveHttpError);
  });

  it('maps invalid JSON responses', async () => {
    const client = new GoogleDriveClient(async () => new Response('not-json', { status: 200 }));

    await assert.rejects(() => client.listBackups({ accessToken: 'token' }), GoogleDriveInvalidResponseError);
  });

  it('maps cancelled requests', async () => {
    const client = new GoogleDriveClient(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError');
    });

    await assert.rejects(() => client.listBackups({ accessToken: 'token' }), GoogleDriveAbortError);
  });
});

function clientWithStatus(status: number): GoogleDriveClient {
  return new GoogleDriveClient(async () => new Response('{}', { status }));
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}
