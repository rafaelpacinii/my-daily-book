import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  GoogleBooksClient,
  GoogleBooksInvalidQueryError,
  GoogleBooksService,
} from '@/src/infrastructure/google-books';

const config = {
  apiKey: 'test-key',
  baseUrl: 'https://www.googleapis.com/books/v1',
};

describe('GoogleBooksService', () => {
  it('rejects empty search and normalizes pagination', async () => {
    const service = serviceWithBody({ totalItems: 0 });

    await assert.rejects(() => service.searchGoogleBooks({ query: '   ' }), GoogleBooksInvalidQueryError);

    const result = await service.searchGoogleBooks({ query: 'Dune', startIndex: 2, maxResults: 99 });

    assert.equal(result.startIndex, 2);
    assert.equal(result.items.length, 0);
  });

  it('discards invalid items and accepts absent items', async () => {
    const service = serviceWithBody({
      totalItems: 3,
      items: [
        { id: 'valid', volumeInfo: { title: 'Valid' } },
        { id: 'missing-title', volumeInfo: {} },
        { volumeInfo: { title: 'Missing ID' } },
      ],
    });

    const result = await service.searchGoogleBooks({ query: 'Valid' });

    assert.equal(result.totalItems, 3);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.googleBooksId, 'valid');

    const emptyItemsResult = await serviceWithBody({ totalItems: 0 }).searchGoogleBooks({ query: 'Valid' });
    assert.deepEqual(emptyItemsResult.items, []);
  });

  it('finds ISBN results with deterministic ordering', async () => {
    const service = serviceWithBody({
      totalItems: 2,
      items: [
        { id: 'b', volumeInfo: { title: 'Beta' } },
        { id: 'a', volumeInfo: { title: 'Alpha' } },
      ],
    });

    const result = await service.findGoogleBookByIsbn({ isbn: '978-0-441-17271-9' });

    assert.deepEqual(result.map((volume) => volume.googleBooksId), ['a', 'b']);
  });

  it('searches possible editions by simple score', async () => {
    const service = serviceWithBody({
      totalItems: 3,
      items: [
        { id: 'same', volumeInfo: { title: 'Dune', authors: ['Frank Herbert'] } },
        { id: 'close', volumeInfo: { title: 'Dune', authors: ['Frank Herbert'], language: 'en' } },
        { id: 'far', volumeInfo: { title: 'Other', authors: ['Other'] } },
      ],
    });

    const result = await service.searchPossibleEditions({
      source: 'google_books',
      externalId: 'same',
      googleBooksId: 'same',
      etag: null,
      title: 'Dune',
      subtitle: null,
      description: null,
      authors: ['Frank Herbert'],
      publisher: null,
      publishedDate: null,
      pageCount: null,
      language: 'en',
      printType: null,
      format: null,
      subjects: [],
      isbn10: null,
      isbn13: '9780441172719',
      thumbnailUrl: null,
      smallThumbnailUrl: null,
      coverUrl: null,
      previewLink: null,
      infoLink: null,
      canonicalVolumeLink: null,
    });

    assert.equal(result[0]?.volume.googleBooksId, 'close');
    assert.ok((result[0]?.score ?? 0) > (result[1]?.score ?? 0));
  });
});

function serviceWithBody(body: unknown): GoogleBooksService {
  return new GoogleBooksService(
    new GoogleBooksClient({
      config,
      fetchFn: async () => new Response(JSON.stringify(body), { status: 200 }),
    }),
  );
}
