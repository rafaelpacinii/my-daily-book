import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  missingThemeProviderMessage,
  resolveThemeMode,
} from '@/src/presentation/providers/theme-mode';

describe('theme mode resolution', () => {
  it('resolves system mode from the device color scheme', () => {
    assert.equal(resolveThemeMode('system', 'dark'), 'dark');
    assert.equal(resolveThemeMode('system', 'light'), 'light');
    assert.equal(resolveThemeMode('system', null), 'light');
  });

  it('keeps explicit light and dark preferences', () => {
    assert.equal(resolveThemeMode('light', 'dark'), 'light');
    assert.equal(resolveThemeMode('dark', 'light'), 'dark');
  });

  it('keeps the provider usage error clear', () => {
    assert.equal(missingThemeProviderMessage, 'useAppTheme must be used within AppThemeProvider.');
  });
});
