import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  ApplicationApi,
  DailyReadingSummary,
  ReadingCycleDetails,
  ReadingHistoryItem,
} from '@/src/application';

import { loadReadingHomeViewModel } from '../reading-home-loader';

describe('reading controller', () => {
  it('loads active cycles, the daily summary and recent history through the public API', async () => {
    const api = createApi();
    const viewModel = await loadReadingHomeViewModel(api, '2026-06-15');

    assert.deepEqual(calls, [
      'listActiveCycles',
      'getDailySummary:2026-06-15',
      'listHistory:3:lastReadAt:desc',
    ]);
    assert.equal(viewModel.activeCycles.length, 1);
    assert.equal(viewModel.activeCycles[0]?.nextStartPage, 26);
    assert.equal(viewModel.dailySummary.pagesReadLabel, '25 pages');
    assert.equal(viewModel.recentHistory.length, 1);
  });

  it('propagates loading failures so the screen can show retry state', async () => {
    const error = new Error('reading failed');
    const api = createApi({
      listActiveCycles: () => {
        throw error;
      },
    });

    await assert.rejects(
      () => loadReadingHomeViewModel(api, '2026-06-15'),
      error,
    );
  });
});

let calls: string[] = [];

function createApi(overrides: Partial<ApplicationApi['reading']> = {}): ApplicationApi {
  calls = [];

  const reading = {
    listActiveCycles: () => {
      calls.push('listActiveCycles');
      return [cycleDetails()];
    },
    getDailySummary: (date: string) => {
      calls.push(`getDailySummary:${date}`);
      return dailySummary(date);
    },
    listHistory: (input?: { limit?: number; orderBy?: string; orderDirection?: string }) => {
      calls.push(`listHistory:${input?.limit}:${input?.orderBy}:${input?.orderDirection}`);
      return {
        items: [historyItem()],
        total: 1,
        limit: input?.limit ?? 20,
        offset: 0,
        hasMore: false,
      };
    },
    ...overrides,
  } as unknown as ApplicationApi['reading'];

  return { reading } as unknown as ApplicationApi;
}

function dailySummary(readingDate: string): DailyReadingSummary {
  return {
    readingDate,
    pagesRead: 25,
    durationSeconds: 900,
    logCount: 2,
    booksRead: 1,
    logs: [],
  };
}

function historyItem(): ReadingHistoryItem {
  const details = cycleDetails();

  return {
    cycle: details.cycle,
    libraryBook: details.libraryBook,
    work: details.work,
    authors: details.authors,
    edition: details.edition,
    totalPagesRead: details.totalPagesRead,
    totalDurationSeconds: details.totalDurationSeconds,
  };
}

function cycleDetails(): ReadingCycleDetails {
  return {
    cycle: {
      id: 'cycle-1',
      libraryBookId: 'library-book-1',
      editionId: 'edition-1',
      bookCopyId: null,
      cycleNumber: 1,
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
      pageCount: 100,
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
        id: 'log-1',
        readingCycleId: 'cycle-1',
        readingDate: '2026-06-15',
        startPage: 1,
        endPage: 25,
        durationSeconds: 900,
        notes: null,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    progressPercentage: 25,
    totalPagesRead: 25,
    totalDurationSeconds: 900,
  };
}
