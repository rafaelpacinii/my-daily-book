import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { searchGoogleBooks } from '@/src/application/use-cases/google-books';
import type { BookMetadata } from '@/src/domain/books';
import { BrasilApiBookNotFoundError } from '@/src/infrastructure/brasil-api';
import type { SearchGoogleBooksInput } from '@/src/infrastructure/google-books';

describe('ISBN fallback search', () => {
  it('uses Google Books results for ISBN before trying BrasilAPI', async () => {
    let brasilCalls = 0;
    const result = await searchGoogleBooks(
      { query: '978-85-457-0287-0' },
      googleService({ isbnItems: [metadata('google_books', 'google-1')] }),
      brasilService(() => {
        brasilCalls += 1;
        return metadata('brasil_api', 'brasil-api:isbn:9788545702870');
      }),
    );

    assert.equal(result.items[0]?.source, 'google_books');
    assert.equal(brasilCalls, 0);
  });

  it('uses BrasilAPI only when an ISBN search has no Google Books results', async () => {
    const result = await searchGoogleBooks(
      { query: '9788545702870' },
      googleService({ isbnItems: [] }),
      brasilService(() => metadata('brasil_api', 'brasil-api:isbn:9788545702870')),
    );

    assert.equal(result.totalItems, 1);
    assert.equal(result.items[0]?.source, 'brasil_api');
  });

  it('does not call BrasilAPI for title searches', async () => {
    let brasilCalls = 0;
    const result = await searchGoogleBooks(
      { query: 'Dune' },
      googleService({ searchItems: [metadata('google_books', 'google-2')] }),
      brasilService(() => {
        brasilCalls += 1;
        return metadata('brasil_api', 'brasil-api:isbn:9788545702870');
      }),
    );

    assert.equal(result.items[0]?.externalId, 'google-2');
    assert.equal(brasilCalls, 0);
  });

  it('returns not found when both Google Books and BrasilAPI miss the ISBN', async () => {
    const result = await searchGoogleBooks(
      { query: '9788545702870' },
      googleService({ isbnItems: [] }),
      brasilService(() => {
        throw new BrasilApiBookNotFoundError('not found');
      }),
    );

    assert.deepEqual(result.items, []);
    assert.equal(result.totalItems, 0);
  });
});

function googleService(input: {
  isbnItems?: BookMetadata[];
  searchItems?: BookMetadata[];
}): Parameters<typeof searchGoogleBooks>[1] {
  return {
    async findGoogleBookByIsbn() {
      return input.isbnItems ?? [];
    },
    async searchGoogleBooks(searchInput: SearchGoogleBooksInput) {
      return {
        totalItems: input.searchItems?.length ?? 0,
        startIndex: searchInput.startIndex ?? 0,
        items: input.searchItems ?? [],
      };
    },
  };
}

function brasilService(findBookByIsbn: () => BookMetadata): Parameters<typeof searchGoogleBooks>[2] {
  return {
    async findBookByIsbn() {
      return findBookByIsbn();
    },
  };
}

function metadata(source: BookMetadata['source'], externalId: string): BookMetadata {
  return {
    source,
    externalId,
    googleBooksId: source === 'google_books' ? externalId : null,
    etag: null,
    title: 'Book',
    subtitle: null,
    description: null,
    authors: [],
    publisher: null,
    publishedDate: null,
    pageCount: null,
    language: null,
    printType: null,
    format: null,
    subjects: [],
    isbn10: null,
    isbn13: '9788545702870',
    thumbnailUrl: null,
    smallThumbnailUrl: null,
    coverUrl: null,
    previewLink: null,
    infoLink: null,
    canonicalVolumeLink: null,
  };
}
