import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ReadingCycleDetails } from '@/src/application';
import { i18n } from '@/src/localization/i18n';

import { mapActiveReading, mapDailyReadingSummary } from '../reading-mappers';

describe('reading mappers', () => {
  it('maps active cycles without treating unknown progress as zero', () => {
    const viewModel = mapActiveReading({
      cycle: {
        id: 'cycle-1',
        libraryBookId: 'library-book-1',
        editionId: 'edition-1',
        bookCopyId: null,
        cycleNumber: 2,
        status: 'reading',
        startedAt: '2026-06-10',
        finishedAt: null,
        droppedAt: null,
        lastReadAt: '2026-06-15',
        rating: null,
        notes: null,
        createdAt: 1,
        updatedAt: 1,
      },
      libraryBook: {
        id: 'library-book-1',
        workId: 'work-1',
        status: 'reading',
        addedAt: 1,
        rating: null,
        notes: null,
        createdAt: 1,
        updatedAt: 1,
      },
      work: {
        id: 'work-1',
        title: 'A Book',
        originalTitle: null,
        description: null,
        originalLanguage: null,
        firstPublishedDate: null,
        createdAt: 1,
        updatedAt: 1,
      },
      authors: [{ id: 'author-1', name: 'Author', createdAt: 1, updatedAt: 1 }],
      edition: {
        id: 'edition-1',
        workId: 'work-1',
        metadataSource: 'google_books',
        externalMetadataId: 'google-1',
        googleBooksId: 'google-1',
        googleBooksEtag: null,
        title: 'A Book Edition',
        subtitle: null,
        description: null,
        publisher: null,
        publishedDate: null,
        pageCount: null,
        language: null,
        printType: null,
        isbn10: null,
        isbn13: null,
        thumbnailUrl: null,
        smallThumbnailUrl: null,
        coverSource: 'none',
        coverMimeType: null,
        coverFileName: null,
        coverUrl: null,
        previewLink: null,
        infoLink: null,
        canonicalVolumeLink: null,
        metadataFetchedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      copy: null,
      logs: [
        {
          id: 'log-2',
          readingCycleId: 'cycle-1',
          readingDate: '2026-06-15',
          startPage: 11,
          endPage: 20,
          durationSeconds: 600,
          notes: null,
          createdAt: 2,
          updatedAt: 2,
        },
        {
          id: 'log-1',
          readingCycleId: 'cycle-1',
          readingDate: '2026-06-14',
          startPage: 1,
          endPage: 10,
          durationSeconds: null,
          notes: null,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      progressPercentage: null,
      totalPagesRead: 20,
      totalDurationSeconds: 600,
    } satisfies ReadingCycleDetails);

    assert.equal(viewModel.progressPercentage, null);
    assert.equal(viewModel.progressLabel, 'Progress unavailable');
    assert.equal(viewModel.currentPageLabel, 'Page 20');
    assert.equal(viewModel.nextStartPage, 21);
    assert.deepEqual(viewModel.logs.map((log) => log.id), ['log-1', 'log-2']);
  });

  it('maps daily summaries from the public query result', () => {
    const summary = mapDailyReadingSummary({
      readingDate: '2026-06-15',
      pagesRead: 53,
      durationSeconds: 3600,
      logCount: 2,
      booksRead: 1,
      logs: [],
    });

    assert.equal(summary.pagesReadLabel, '53 pages');
    assert.equal(summary.durationLabel, '1h');
    assert.equal(summary.sessionsLabel, '2 sessions');
    assert.equal(summary.booksLabel, '1 book');
  });

  it('localizes mapped reading labels in pt-BR', async () => {
    await i18n.changeLanguage('pt-BR');

    try {
      const summary = mapDailyReadingSummary({
        readingDate: '2026-06-15',
        pagesRead: 53,
        durationSeconds: 3600,
        logCount: 2,
        booksRead: 1,
        logs: [],
      });

      assert.equal(summary.pagesReadLabel, '53 páginas');
      assert.equal(summary.sessionsLabel, '2 sessões');
      assert.equal(summary.booksLabel, '1 livro');
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});
