import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GoogleBooksInvalidQueryError, buildGoogleBooksQuery } from '@/src/infrastructure/google-books';

describe('Google Books query builder', () => {
  it('builds text, title, author, ISBN and combined queries', () => {
    assert.equal(buildGoogleBooksQuery({ text: '  fantasy   books ' }), 'fantasy books');
    assert.equal(buildGoogleBooksQuery({ title: ' O Hobbit ' }), 'intitle:O Hobbit');
    assert.equal(buildGoogleBooksQuery({ author: ' Tolkien ' }), 'inauthor:Tolkien');
    assert.equal(buildGoogleBooksQuery({ isbn: ' 978-0000000000 ' }), 'isbn:978-0000000000');
    assert.equal(
      buildGoogleBooksQuery({ title: 'Dune', author: 'Frank Herbert', publisher: 'Ace' }),
      'intitle:Dune inauthor:Frank Herbert inpublisher:Ace',
    );
  });

  it('rejects empty queries', () => {
    assert.throws(() => buildGoogleBooksQuery({ text: '   ' }), GoogleBooksInvalidQueryError);
  });
});

