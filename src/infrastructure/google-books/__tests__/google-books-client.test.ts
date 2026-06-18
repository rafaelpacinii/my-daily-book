import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  GoogleBooksAbortError,
  GoogleBooksClient,
  GoogleBooksHttpError,
  GoogleBooksInvalidResponseError,
  GoogleBooksNetworkError,
  GoogleBooksRateLimitError,
  GoogleBooksVolumeNotFoundError,
} from '@/src/infrastructure/google-books';

const config = {
  apiKey: 'test-key',
  baseUrl: 'https://www.googleapis.com/books/v1',
};

describe('GoogleBooksClient', () => {
  it('handles successful search responses', async () => {
    const client = new GoogleBooksClient({
      config,
      fetchFn: async (url) => {
        const requestUrl = String(url);
        assert.ok(requestUrl.includes('/volumes?'));
        assert.ok(requestUrl.includes('key=test-key'));

        return jsonResponse({ totalItems: 1, items: [volumeResource('one', 'Dune')] });
      },
    });

    const result = await client.searchVolumes({ query: 'Dune', maxResults: 10 });

    assert.equal(result.totalItems, 1);
    assert.equal(result.items?.[0]?.id, 'one');
  });

  it('maps HTTP failures', async () => {
    await assert.rejects(() => clientWithStatus(404).getVolumeById('missing'), GoogleBooksVolumeNotFoundError);
    await assert.rejects(() => clientWithStatus(403).searchVolumes({ query: 'Dune' }), GoogleBooksHttpError);
    await assert.rejects(() => clientWithStatus(429).searchVolumes({ query: 'Dune' }), GoogleBooksRateLimitError);
    await assert.rejects(() => clientWithStatus(500).searchVolumes({ query: 'Dune' }), GoogleBooksHttpError);
  });

  it('handles invalid JSON, network errors and aborts distinctly', async () => {
    const invalidJsonClient = new GoogleBooksClient({
      config,
      fetchFn: async () => new Response('not-json', { status: 200 }),
    });
    await assert.rejects(
      () => invalidJsonClient.searchVolumes({ query: 'Dune' }),
      GoogleBooksInvalidResponseError,
    );

    const networkClient = new GoogleBooksClient({
      config,
      fetchFn: async () => {
        throw new TypeError('network failed');
      },
    });
    await assert.rejects(() => networkClient.searchVolumes({ query: 'Dune' }), GoogleBooksNetworkError);

    const abortClient = new GoogleBooksClient({
      config,
      fetchFn: async () => {
        throw new DOMException('Aborted', 'AbortError');
      },
    });
    await assert.rejects(() => abortClient.searchVolumes({ query: 'Dune' }), GoogleBooksAbortError);
  });
});

function clientWithStatus(status: number): GoogleBooksClient {
  return new GoogleBooksClient({
    config,
    fetchFn: async () => new Response('{}', { status }),
  });
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function volumeResource(id: string, title: string): unknown {
  return {
    id,
    volumeInfo: { title },
  };
}

