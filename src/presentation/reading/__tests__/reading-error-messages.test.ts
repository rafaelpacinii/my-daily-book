import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ValidationError } from '@/src/domain/errors';
import { mapReadingErrorMessage } from '@/src/presentation/reading/reading-error-messages';

describe('reading error messages', () => {
  it('maps known reading continuity and overlap failures to safe copy', () => {
    assert.equal(
      mapReadingErrorMessage(new ValidationError('reading pages are discontinuous and require explicit confirmation.'), 'saveLog'),
      'This page range has a gap. Confirm to save it anyway.',
    );
    assert.equal(
      mapReadingErrorMessage(new ValidationError('reading pages overlap an existing log and require confirmation.'), 'saveLog'),
      'This page range overlaps an existing record.',
    );
  });

  it('falls back to contextual action copy instead of exposing raw errors', () => {
    assert.equal(
      mapReadingErrorMessage(new Error('DatabaseError: SQLITE constraint failed'), 'start'),
      'Unable to start reading.',
    );
  });
});
