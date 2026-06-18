import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryAppearancePreferenceStore } from '../memory-appearance-preference-store';

describe('appearance preference store', () => {
  it('persists and clears theme preferences', async () => {
    const store = createMemoryAppearancePreferenceStore();

    assert.equal(await store.getPreference(), 'system');
    await store.setPreference('dark');
    assert.equal(await store.getPreference(), 'dark');
    await store.setPreference('light');
    assert.equal(await store.getPreference(), 'light');
    await store.clearPreference();
    assert.equal(await store.getPreference(), 'system');
  });

  it('restores the provided initial preference', async () => {
    const store = createMemoryAppearancePreferenceStore('dark');

    assert.equal(await store.getPreference(), 'dark');
  });
});
