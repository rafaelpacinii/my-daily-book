import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ApplicationApi } from '@/src/application';
import {
  applicationReducer,
  initialApplicationState,
  missingApplicationProviderMessage,
} from '@/src/presentation/providers/application-state';

describe('application provider state', () => {
  it('starts idle without an api or initialization error', () => {
    assert.equal(initialApplicationState.status, 'idle');
    assert.equal(initialApplicationState.api, null);
    assert.equal(initialApplicationState.initializationError, null);
  });

  it('moves through loading and success states', () => {
    const loadingState = applicationReducer(initialApplicationState, { type: 'start' });
    const api = Symbol('ApplicationApi') as unknown as ApplicationApi;
    const readyState = applicationReducer(loadingState, { type: 'success', api });

    assert.equal(loadingState.status, 'initializing');
    assert.equal(loadingState.initializationError, null);
    assert.equal(readyState.status, 'ready');
    assert.equal(readyState.api, api);
  });

  it('stores initialization errors and clears them on retry start', () => {
    const error = new Error('init failed');
    const errorState = applicationReducer(initialApplicationState, { type: 'failure', error });
    const retryState = applicationReducer(errorState, { type: 'start' });

    assert.equal(errorState.status, 'error');
    assert.equal(errorState.initializationError, error);
    assert.equal(errorState.api, null);
    assert.equal(retryState.status, 'initializing');
    assert.equal(retryState.initializationError, null);
  });

  it('keeps the provider usage error clear', () => {
    assert.equal(
      missingApplicationProviderMessage,
      'useApplication must be used within ApplicationProvider.',
    );
  });
});
