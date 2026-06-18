import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  initializeApplication,
  resetApplicationInitializationForTests,
} from '@/src/application/bootstrap/initialize-application';
import { ApplicationInitializationError } from '@/src/application/bootstrap/application-initialization-error';
import type { ApplicationApi } from '@/src/application/api';

describe('initializeApplication', () => {
  it('shares concurrent initialization and returns the same instance after success', async () => {
    resetApplicationInitializationForTests();
    let calls = 0;
    const api = {} as ApplicationApi;
    const dependencies = {
      initializeDatabase: async () => {
        calls += 1;
      },
      validateConfig: () => undefined,
      createApi: () => api,
    };

    const [first, second] = await Promise.all([
      initializeApplication(dependencies),
      initializeApplication(dependencies),
    ]);
    const third = await initializeApplication(dependencies);

    assert.equal(calls, 1);
    assert.equal(first, second);
    assert.equal(first, third);
    assert.equal(first.api, api);
  });

  it('wraps initialization failures and allows retry after failure', async () => {
    resetApplicationInitializationForTests();
    let shouldFail = true;
    const api = {} as ApplicationApi;

    await assert.rejects(
      () =>
        initializeApplication({
          initializeDatabase: async () => {
            if (shouldFail) throw new Error('boom');
          },
          validateConfig: () => undefined,
          createApi: () => api,
        }),
      ApplicationInitializationError,
    );

    shouldFail = false;
    const initialized = await initializeApplication({
      initializeDatabase: async () => undefined,
      validateConfig: () => undefined,
      createApi: () => api,
    });

    assert.equal(initialized.api, api);
    resetApplicationInitializationForTests();
  });
});
