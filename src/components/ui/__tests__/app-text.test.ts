import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveAppTextStyle } from '@/src/components/ui/app-text-style';
import { darkTheme, lightTheme } from '@/src/theme';

describe('AppText style resolution', () => {
  it('applies textPrimary by default in light and dark themes', () => {
    assert.equal(
      resolveAppTextStyle({ theme: lightTheme, variant: 'body' }).color,
      lightTheme.colors.textPrimary,
    );
    assert.equal(
      resolveAppTextStyle({ theme: darkTheme, variant: 'body' }).color,
      darkTheme.colors.textPrimary,
    );
  });

  it('lets nested text inherit the parent color when no child color is provided', () => {
    const parent = resolveAppTextStyle({
      theme: lightTheme,
      variant: 'body',
      color: 'textInverse',
    });
    const child = resolveAppTextStyle({
      theme: lightTheme,
      variant: 'body',
      inheritedColor: parent.color,
      style: { fontWeight: '700' },
    });

    assert.equal(child.color, lightTheme.colors.textInverse);
    assert.equal(child.fontWeight, '700');
  });

  it('allows explicit child color and external styles to override predictably', () => {
    const child = resolveAppTextStyle({
      theme: darkTheme,
      variant: 'body',
      inheritedColor: darkTheme.colors.textInverse,
      color: 'accent',
      style: { color: darkTheme.colors.textSecondary },
    });

    assert.equal(child.color, darkTheme.colors.textSecondary);
    assert.notEqual(child.color, 'transparent');
  });
});
