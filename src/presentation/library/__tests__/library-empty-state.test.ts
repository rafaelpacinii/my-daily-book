import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getLibraryEmptyStateContent } from '../components/library-empty-state-content';

describe('LibraryEmptyState', () => {
  it('keeps the full empty action label intact', () => {
    const content = getLibraryEmptyStateContent(false);

    assert.equal(content.actionLabel, 'Add your first book');
    assert.equal(content.actionLabel.includes('book'), true);
  });

  it('uses search copy when filters are active', () => {
    const content = getLibraryEmptyStateContent(true);

    assert.equal(content.title, 'No books found');
    assert.equal(content.actionLabel, 'Clear filters');
  });
});
