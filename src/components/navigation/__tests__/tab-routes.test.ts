import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tabRoutes } from '@/src/components/navigation/tab-routes';

describe('tab routes', () => {
  it('defines the five allowed shell tabs in order', () => {
    assert.deepEqual(
      tabRoutes.map((route) => route.name),
      ['index', 'library', 'reading', 'lists', 'settings'],
    );
    assert.deepEqual(
      tabRoutes.map((route) => route.title),
      ['Home', 'Library', 'Reading', 'Lists', 'Settings'],
    );
    assert.equal(tabRoutes.length, 5);
  });

  it('does not use the app logo as a tab icon', () => {
    assert.equal(tabRoutes.some((route) => route.icon.includes('logo')), false);
  });
});
