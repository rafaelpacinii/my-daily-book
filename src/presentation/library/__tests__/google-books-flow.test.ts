import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mergeUniqueGoogleBooksItems,
  validateGoogleBooksQuery,
} from '@/src/presentation/library/add/google-books-search-controller';
import {
  defaultAddBookConfirmation,
  validateAddBookConfirmation,
} from '@/src/presentation/library/add/add-book-validation';
import {
  defaultAddCopyForm,
  validateAddCopyForm,
} from '@/src/presentation/library/details/library-book-details-controller';
import type { GoogleBooksResultViewModel } from '@/src/presentation/library/library-types';

describe('google books and copy flow helpers', () => {
  it('validates Google Books search query', () => {
    assert.equal(validateGoogleBooksQuery(''), 'Enter a title, author or ISBN.');
    assert.equal(validateGoogleBooksQuery(' dune '), null);
  });

  it('deduplicates paginated Google Books results', () => {
    const merged = mergeUniqueGoogleBooksItems(
      [googleResult('a', 'A')],
      [googleResult('a', 'A duplicate'), googleResult('b', 'B')],
    );

    assert.deepEqual(merged.map((item) => item.googleBooksId), ['a', 'b']);
  });

  it('validates add book confirmation', () => {
    assert.deepEqual(validateAddBookConfirmation(defaultAddBookConfirmation), {
      valid: true,
      message: null,
    });
    assert.equal(
      validateAddBookConfirmation({
        ...defaultAddBookConfirmation,
        workMode: 'existing',
        existingLibraryBookId: '',
      }).message,
      'Choose an existing work.',
    );
    assert.equal(
      validateAddBookConfirmation({
        ...defaultAddBookConfirmation,
        acquiredAt: '2026-02-31',
      }).message,
      'Use YYYY-MM-DD for acquired date.',
    );
  });

  it('validates add copy form', () => {
    assert.equal(validateAddCopyForm(defaultAddCopyForm), 'Choose an edition.');
    assert.equal(
      validateAddCopyForm({
        ...defaultAddCopyForm,
        editionId: 'edition-1',
        acquiredAt: '2026-06-15',
      }),
      null,
    );
  });
});

function googleResult(googleBooksId: string, title: string): GoogleBooksResultViewModel {
  return {
    source: 'google_books',
    externalId: googleBooksId,
    googleBooksId,
    title,
    subtitle: null,
    authors: 'Author',
    publisher: null,
    publishedDate: null,
    pageCount: null,
    language: null,
    isbn: null,
    coverUrl: null,
    sourceLabel: 'Google Books',
  };
}
