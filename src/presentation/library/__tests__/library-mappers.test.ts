import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  GoogleBooksVolume,
  LibraryBookDetails,
  LibraryBookSummary,
} from '@/src/application';
import {
  mapGoogleBookDetails,
  mapLibraryBookDetails,
  mapLibraryBookSummary,
  mapPossibleEdition,
} from '@/src/presentation/library/library-mappers';

describe('library mappers', () => {
  it('maps library summaries for cards', () => {
    const mapped = mapLibraryBookSummary(summary());

    assert.equal(mapped.title, 'Mapped Book');
    assert.equal(mapped.authors, 'Author Name');
    assert.equal(mapped.statusLabel, 'Reading');
    assert.equal(mapped.copyCount, 1);
    assert.equal(mapped.progressPercentage, 45);
  });

  it('maps details with editions, copies and reading history', () => {
    const mapped = mapLibraryBookDetails(details());

    assert.equal(mapped.editions[0]?.hasCopy, true);
    assert.equal(mapped.copies[0]?.formatLabel, 'Digital');
    assert.equal(mapped.readingHistory[0]?.totalPages, 10);
    assert.equal(mapped.lists[0], 'Favorites');
    assert.equal(mapped.goals[0], 'June reads');
  });

  it('maps Google Books details and possible editions', () => {
    const volume = googleVolume('vol-1');
    const mapped = mapGoogleBookDetails(volume);
    const possible = mapPossibleEdition({ volume: googleVolume('vol-2'), score: 80, reasons: ['same title'] });

    assert.equal(mapped.googleBooksId, 'vol-1');
    assert.equal(mapped.isbn13, '9781234567890');
    assert.equal(possible.score, 80);
    assert.deepEqual(possible.reasons, ['same title']);
  });
});

function summary(): LibraryBookSummary {
  return {
    libraryBook: { id: 'book-1', workId: 'work-1', status: 'reading', rating: 4 },
    work: { id: 'work-1', title: 'Mapped Book', originalTitle: null, description: 'Work description' },
    authors: [{ id: 'author-1', name: 'Author Name' }],
    copies: [{ id: 'copy-1', editionId: 'edition-1', format: 'digital' }],
    activeReadingCycle: null,
    latestReadingCycle: { lastReadAt: '2026-06-15' },
    currentPage: 45,
    pageCount: 100,
    isbn10: null,
    isbn13: '9781234567890',
    progressPercentage: 45,
    coverUrl: 'https://example.com/cover.jpg',
  } as unknown as LibraryBookSummary;
}

function details(): LibraryBookDetails {
  return {
    ...summary(),
    editions: [{ id: 'edition-1', title: 'Edition 1', coverUrl: null, thumbnailUrl: null }],
    cycles: [],
    readingLogsByCycle: [{
      cycle: {
        id: 'cycle-1',
        cycleNumber: 1,
        status: 'completed',
        editionId: 'edition-1',
        startedAt: '2026-06-01',
        finishedAt: '2026-06-02',
        droppedAt: null,
      },
      logs: [{ startPage: 1, endPage: 10, durationSeconds: 600 }],
    }],
    lists: [{ list: { name: 'Favorites' }, item: {} }],
    goals: [{ goal: { name: 'June reads' }, item: {} }],
  } as unknown as LibraryBookDetails;
}

function googleVolume(id: string): GoogleBooksVolume {
  return {
    source: 'google_books',
    externalId: id,
    googleBooksId: id,
    etag: null,
    title: 'Google Book',
    subtitle: null,
    description: 'Description',
    authors: ['Author Name'],
    publisher: 'Publisher',
    publishedDate: '2026',
    pageCount: 200,
    language: 'en',
    printType: 'BOOK',
    format: null,
    subjects: [],
    isbn10: '123456789X',
    isbn13: '9781234567890',
    thumbnailUrl: null,
    smallThumbnailUrl: null,
    coverUrl: 'https://example.com/cover.jpg',
    previewLink: 'https://example.com/preview',
    infoLink: null,
    canonicalVolumeLink: null,
  };
}
