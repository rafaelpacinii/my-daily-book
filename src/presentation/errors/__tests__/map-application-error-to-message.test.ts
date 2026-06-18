import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ValidationError } from '@/src/domain/errors';
import { mapApplicationErrorToMessage } from '@/src/presentation/errors';

describe('mapApplicationErrorToMessage', () => {
  it('maps validation errors to configuration copy', () => {
    assert.deepEqual(mapApplicationErrorToMessage(new ValidationError('Invalid setup')), {
      title: 'Configuration needs attention',
      description: 'Some required local configuration is missing or invalid.',
    });
  });

  it('maps unknown errors to generic bootstrap copy', () => {
    assert.deepEqual(mapApplicationErrorToMessage(new Error('Unexpected')), {
      title: 'My Daily Book could not start',
      description: 'Something prevented the app from initializing. Please try again.',
    });
  });
});
