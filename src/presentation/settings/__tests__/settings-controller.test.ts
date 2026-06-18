import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runDriveConnectAction } from '../settings-drive-actions';

describe('settings controller drive connect action', () => {
  it('clears the connecting state after success', async () => {
    const transientStates: ('connecting' | null)[] = [];
    const messages: string[] = [];
    let refreshed = 0;

    await runDriveConnectAction({
      connect: async () => undefined,
      setDriveTransient: (state) => transientStates.push(state),
      setMessage: (message) => {
        if (message) messages.push(message);
      },
      refresh: () => {
        refreshed += 1;
      },
      successMessage: 'connected',
    });

    assert.deepEqual(transientStates, ['connecting', null]);
    assert.deepEqual(messages, ['connected']);
    assert.equal(refreshed, 1);
  });

  it('clears the connecting state after failure', async () => {
    const transientStates: ('connecting' | null)[] = [];

    await assert.rejects(
      () =>
        runDriveConnectAction({
          connect: async () => {
            throw new Error('missing config');
          },
          setDriveTransient: (state) => transientStates.push(state),
          setMessage: () => undefined,
          refresh: () => undefined,
          successMessage: 'connected',
        }),
      /missing config/,
    );

    assert.deepEqual(transientStates, ['connecting', null]);
  });
});
