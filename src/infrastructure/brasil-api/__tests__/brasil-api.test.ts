import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BrasilApiBookNotFoundError,
  BrasilApiClient,
  BrasilApiInvalidIsbnError,
  BrasilApiInvalidResponseError,
  BrasilApiRateLimitError,
  BrasilApiUnavailableError,
  mapBrasilApiIsbnToBookMetadata,
  parseBrasilApiIsbnResponse,
} from '@/src/infrastructure/brasil-api';

describe('BrasilAPI ISBN integration', () => {
  it('parses and maps a complete ISBN response', () => {
    const parsed = parseBrasilApiIsbnResponse({
      isbn: '978-85-457-0287-0',
      title: 'Torto Arado',
      subtitle: 'Romance',
      authors: [' Itamar Vieira Junior ', 'Itamar Vieira Junior'],
      publisher: 'Todavia',
      synopsis: 'Descrição',
      year: 2019,
      format: 'PHYSICAL',
      page_count: 264,
      subjects: ['Ficção'],
      cover_url: 'https://example.com/cover.jpg',
    });
    const mapped = mapBrasilApiIsbnToBookMetadata(parsed);

    assert.equal(mapped.source, 'brasil_api');
    assert.equal(mapped.externalId, 'brasil-api:isbn:9788545702870');
    assert.equal(mapped.googleBooksId, null);
    assert.equal(mapped.title, 'Torto Arado');
    assert.deepEqual(mapped.authors, ['Itamar Vieira Junior']);
    assert.equal(mapped.publishedDate, '2019');
    assert.equal(mapped.pageCount, 264);
    assert.equal(mapped.isbn13, '9788545702870');
    assert.equal(mapped.format, 'PHYSICAL');
  });

  it('accepts missing optional fields without inventing metadata', () => {
    const mapped = mapBrasilApiIsbnToBookMetadata(parseBrasilApiIsbnResponse({
      isbn: '8535902775',
      title: 'Livro',
    }));

    assert.deepEqual(mapped.authors, []);
    assert.equal(mapped.publisher, null);
    assert.equal(mapped.coverUrl, null);
    assert.equal(mapped.language, null);
    assert.equal(mapped.isbn10, '8535902775');
  });

  it('maps HTTP and invalid response failures', async () => {
    await assert.rejects(
      () => clientWithStatus(400).getBookByIsbn('9788545702870'),
      BrasilApiInvalidIsbnError,
    );
    await assert.rejects(
      () => clientWithStatus(404).getBookByIsbn('9788545702870'),
      BrasilApiBookNotFoundError,
    );
    await assert.rejects(
      () => clientWithStatus(429).getBookByIsbn('9788545702870'),
      BrasilApiRateLimitError,
    );
    await assert.rejects(
      () => clientWithStatus(503).getBookByIsbn('9788545702870'),
      BrasilApiUnavailableError,
    );
    await assert.rejects(
      () => new BrasilApiClient({
        fetchFn: async () => new Response('{', { status: 200 }),
      }).getBookByIsbn('9788545702870'),
      BrasilApiInvalidResponseError,
    );
  });

  it('maps aborted requests without treating them as not found', async () => {
    await assert.rejects(
      () => new BrasilApiClient({
        fetchFn: async () => {
          throw new DOMException('aborted', 'AbortError');
        },
      }).getBookByIsbn('9788545702870', new AbortController().signal),
      { name: 'BrasilApiAbortError' },
    );
  });
});

function clientWithStatus(status: number): BrasilApiClient {
  return new BrasilApiClient({
    fetchFn: async () => new Response('{}', { status }),
  });
}
