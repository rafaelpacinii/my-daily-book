import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  chooseBestCoverUrl,
  extractIsbn10,
  extractIsbn13,
  mapGoogleBooksVolume,
  mapGoogleBooksVolumeToLibraryInput,
  normalizeAuthors,
  normalizeGoogleBooksImageUrl,
  normalizeIsbn,
  normalizePublishedDate,
  scorePossibleEdition,
  sortPossibleEditions,
} from '@/src/infrastructure/google-books';
import type { GoogleBooksVolume, GoogleBooksVolumeResource } from '@/src/infrastructure/google-books';

describe('Google Books normalization', () => {
  it('normalizes complete and partial volumes', () => {
    const volume = mapGoogleBooksVolume(fullVolumeResource());

    assert.equal(volume?.googleBooksId, 'vol-1');
    assert.equal(volume?.title, 'Dune');
    assert.equal(volume?.authors.length, 2);
    assert.equal(volume?.isbn10, '0441172717');
    assert.equal(volume?.isbn13, '9780441172719');
    assert.equal(volume?.coverUrl, 'https://books.google.com/extra.jpg');

    const partial = mapGoogleBooksVolume({
      id: 'vol-2',
      volumeInfo: { title: 'Partial' },
    });

    assert.equal(partial?.title, 'Partial');
    assert.equal(partial?.pageCount, null);
    assert.equal(partial?.authors.length, 0);
  });

  it('normalizes ISBNs, authors, image URLs and dates', () => {
    assert.equal(normalizeIsbn(' 0-441-17271-x '), '044117271X');
    assert.equal(normalizeIsbn('978-0-441-17271-9'), '9780441172719');
    assert.equal(normalizeIsbn('bad'), null);
    assert.equal(extractIsbn10(fullVolumeResource().volumeInfo?.industryIdentifiers), '0441172717');
    assert.equal(extractIsbn13(fullVolumeResource().volumeInfo?.industryIdentifiers), '9780441172719');
    assert.deepEqual(normalizeAuthors([' Frank Herbert ', '', 'Frank Herbert', ' Brian Herbert ']), [
      'Frank Herbert',
      'Brian Herbert',
    ]);
    assert.equal(
      normalizeGoogleBooksImageUrl('http://books.google.com/image.jpg'),
      'https://books.google.com/image.jpg',
    );
    assert.equal(chooseBestCoverUrl({ thumbnail: 'http://books.google.com/thumb.jpg' }), 'https://books.google.com/thumb.jpg');
    assert.equal(normalizePublishedDate('2026'), '2026');
    assert.equal(normalizePublishedDate('2026-05'), '2026-05');
    assert.equal(normalizePublishedDate('2026-05-14'), '2026-05-14');
    assert.equal(normalizePublishedDate('2026-02-31'), null);
  });

  it('maps a volume to add-book input without IDs or copies', () => {
    const volume = mapGoogleBooksVolume(fullVolumeResource());
    assert.ok(volume);

    const input = mapGoogleBooksVolumeToLibraryInput(volume, {
      metadataFetchedAt: 123,
      work: { kind: 'create', data: { title: volume.title } },
    });

    assert.equal(input.work.kind, 'create');
    assert.equal(input.authors[0]?.position, 0);
    assert.equal(input.edition.kind, 'create');
    assert.equal(input.edition.data.metadataFetchedAt, 123);
    assert.equal(input.copy, undefined);
  });

  it('scores possible editions and removes identical volume', () => {
    const source = normalizedVolume('same', 'Dune', ['Frank Herbert'], '9780441172719');
    const same = normalizedVolume('same', 'Dune', ['Frank Herbert'], '9780441172719');
    const close = normalizedVolume('close', 'Dune', ['Frank Herbert'], '9780441172726');
    const far = normalizedVolume('far', 'Different', ['Other Author'], '9780441172733');

    assert.equal(scorePossibleEdition(source, same), null);

    const sorted = sortPossibleEditions([
      scorePossibleEdition(source, far),
      scorePossibleEdition(source, close),
    ].flatMap((result) => (result ? [result] : [])));

    assert.equal(sorted[0]?.volume.googleBooksId, 'close');
    assert.ok((sorted[0]?.score ?? 0) > (sorted[1]?.score ?? 0));
  });
});

function fullVolumeResource(): GoogleBooksVolumeResource {
  return {
    id: 'vol-1',
    etag: 'etag-1',
    volumeInfo: {
      title: 'Dune',
      subtitle: 'Deluxe Edition',
      description: 'A classic.',
      authors: [' Frank Herbert ', 'Frank Herbert', 'Brian Herbert'],
      publisher: 'Ace',
      publishedDate: '2026-05-14',
      pageCount: 412,
      language: 'en',
      printType: 'BOOK',
      industryIdentifiers: [
        { type: 'ISBN_10', identifier: '0441172717' },
        { type: 'ISBN_13', identifier: '978-0-441-17271-9' },
      ],
      imageLinks: {
        smallThumbnail: 'http://books.google.com/small.jpg',
        thumbnail: 'http://books.google.com/thumb.jpg',
        extraLarge: 'http://books.google.com/extra.jpg',
      },
      previewLink: 'https://example.com/preview',
      infoLink: 'https://example.com/info',
      canonicalVolumeLink: 'https://example.com/canonical',
    },
  };
}

function normalizedVolume(
  googleBooksId: string,
  title: string,
  authors: string[],
  isbn13: string,
): GoogleBooksVolume {
  return {
    source: 'google_books',
    externalId: googleBooksId,
    googleBooksId,
    etag: null,
    title,
    subtitle: null,
    description: null,
    authors,
    publisher: 'Ace',
    publishedDate: '2026',
    pageCount: 100,
    language: 'en',
    printType: 'BOOK',
    format: null,
    subjects: [],
    isbn10: null,
    isbn13,
    thumbnailUrl: null,
    smallThumbnailUrl: null,
    coverUrl: null,
    previewLink: null,
    infoLink: null,
    canonicalVolumeLink: null,
  };
}
