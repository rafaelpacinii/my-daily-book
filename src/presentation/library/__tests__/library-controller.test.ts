import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  ApplicationApi,
  LibraryBookSummary,
  PaginatedResult,
} from '@/src/application';
import {
  createLibraryQueryInput,
  defaultLibraryFilters,
  loadLibraryPage,
  mergeUniqueLibraryItems,
} from '@/src/presentation/library/library-controller-core';
import type { LibraryBookViewModel } from '@/src/presentation/library/library-types';

describe('library controller helpers', () => {
  it('maps search, filters and sorting to the public query input', () => {
    const input = createLibraryQueryInput({
      query: '  hobbit  ',
      filters: {
        status: 'reading',
        ownership: 'owned',
        format: 'digital',
        authorId: 'author-1',
      },
      sort: 'title_asc',
      offset: 20,
      limit: 10,
    });

    assert.deepEqual(input, {
      search: 'hobbit',
      status: 'reading',
      owned: true,
      format: 'digital',
      authorId: 'author-1',
      orderBy: 'title',
      orderDirection: 'asc',
      offset: 20,
      limit: 10,
    });
  });

  it('loads a library page from the public API and maps view models', async () => {
    const api = createApi({
      items: [summary('book-1', 'The Hobbit')],
      total: 1,
      hasMore: false,
      limit: 20,
      offset: 0,
    });

    const page = await loadLibraryPage({
      api,
      query: '',
      filters: defaultLibraryFilters,
      sort: 'recently_added',
      offset: 0,
      limit: 20,
    });

    assert.equal(page.items[0]?.title, 'The Hobbit');
    assert.equal(page.items[0]?.statusLabel, 'To read');
    assert.equal(page.total, 1);
    assert.equal(capturedInput?.orderBy, 'addedAt');
  });

  it('merges loaded pages without duplicates', () => {
    const merged = mergeUniqueLibraryItems(
      [bookViewModel('a', 'A')],
      [bookViewModel('a', 'A duplicate'), bookViewModel('b', 'B')],
    );

    assert.deepEqual(merged.map((item) => item.id), ['a', 'b']);
  });
});

let capturedInput: Parameters<ApplicationApi['library']['listBooks']>[0] | undefined;

function createApi(result: PaginatedResult<LibraryBookSummary>): ApplicationApi {
  const listBooks: ApplicationApi['library']['listBooks'] = (input) => {
    capturedInput = input;
    return result;
  };

  return {
    library: {
      listBooks,
    },
  } as unknown as ApplicationApi;
}

function summary(id: string, title: string): LibraryBookSummary {
  return {
    libraryBook: { id, workId: `work-${id}`, status: 'to_read', rating: null },
    work: { id: `work-${id}`, title, originalTitle: null },
    authors: [{ id: 'author-1', name: 'J. R. R. Tolkien' }],
    copies: [],
    activeReadingCycle: null,
    latestReadingCycle: null,
    currentPage: null,
    pageCount: 310,
    isbn10: '123456789X',
    isbn13: '9781234567890',
    progressPercentage: null,
    coverUrl: 'https://example.com/cover.jpg',
  } as unknown as LibraryBookSummary;
}

function bookViewModel(id: string, title: string): LibraryBookViewModel {
  return {
    id,
    title,
    originalTitle: null,
    authors: 'Author',
    coverUrl: null,
    status: 'to_read',
    statusLabel: 'To read',
    progressPercentage: null,
    formatLabel: null,
    copyCount: 0,
    lastReadDate: null,
    rating: null,
  };
}
