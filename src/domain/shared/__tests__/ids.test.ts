import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createIdGenerator } from '@/src/domain/shared';

describe('ID generator', () => {
  it('uses the injected UUID factory synchronously', () => {
    const generated = ['id-1', 'id-2'];
    const idGenerator = createIdGenerator(() => generated.shift() ?? 'missing');

    assert.equal(idGenerator.generate(), 'id-1');
    assert.equal(idGenerator.generate(), 'id-2');
  });

  it('does not depend on global crypto access', () => {
    const originalCrypto = globalThis.crypto;

    try {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: undefined,
      });

      const idGenerator = createIdGenerator(() => 'expo-id');

      assert.equal(idGenerator.generate(), 'expo-id');
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      });
    }
  });
});
