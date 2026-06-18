import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EntityConflictError } from '@/src/database/errors';
import { isDatabaseError, mapDatabaseError } from '@/src/database/repositories/shared';

describe('database error mapping', () => {
  it('recognizes SQLite persistence failures', () => {
    assert.equal(isDatabaseError(new Error('UNIQUE constraint failed: book_lists.id')), true);
    assert.equal(isDatabaseError(new Error('FOREIGN KEY constraint failed')), true);
    assert.equal(isDatabaseError(new Error('no such table: reading_logs')), true);
  });

  it('does not classify runtime reference failures as database errors', () => {
    assert.equal(isDatabaseError(new ReferenceError('crypto is not defined')), false);
  });

  it('keeps unique constraint violations mapped as entity conflicts', () => {
    const error = mapDatabaseError(new Error('UNIQUE constraint failed: book_lists.id'));

    assert.ok(error instanceof EntityConflictError);
  });
});
