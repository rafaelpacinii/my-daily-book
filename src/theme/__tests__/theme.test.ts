import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getTheme, lightTheme, darkTheme } from '@/src/theme';

describe('app theme', () => {
  it('keeps the brand identity colors in the light theme', () => {
    assert.equal(lightTheme.colors.primary, '#244A3A');
    assert.equal(lightTheme.colors.primarySoft, '#8FAF9D');
    assert.equal(lightTheme.colors.background, '#F5F0E6');
    assert.equal(lightTheme.colors.accent, '#C97B63');
    assert.equal(lightTheme.colors.textPrimary, '#2D312F');
  });

  it('returns stable light and dark theme objects', () => {
    assert.equal(getTheme('light'), lightTheme);
    assert.equal(getTheme('dark'), darkTheme);
    assert.equal(darkTheme.mode, 'dark');
    assert.equal(darkTheme.colors.accent, lightTheme.colors.accent);
    assert.equal(darkTheme.spacing.md, lightTheme.spacing.md);
  });

  it('defines semantic text tokens for both themes without transparent fallbacks', () => {
    for (const theme of [lightTheme, darkTheme]) {
      assert.ok(theme.colors.textPrimary);
      assert.ok(theme.colors.textSecondary);
      assert.ok(theme.colors.textInverse);
      assert.notEqual(theme.colors.textPrimary, 'transparent');
      assert.notEqual(theme.colors.textSecondary, 'transparent');
      assert.notEqual(theme.colors.textInverse, 'transparent');
      assert.notEqual(theme.colors.textPrimary, theme.colors.background);
      assert.notEqual(theme.colors.textPrimary, theme.colors.surface);
    }
  });
});
