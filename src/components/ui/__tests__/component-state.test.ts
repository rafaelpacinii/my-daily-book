import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  clampProgressValue,
  getBadgeTone,
  getButtonTone,
  shouldShowOptionalAction,
} from '@/src/components/ui/component-state';

describe('component visual state helpers', () => {
  it('maps button variants and disabled state to semantic tokens', () => {
    assert.deepEqual(getButtonTone('primary', false), {
      backgroundToken: 'primary',
      borderToken: 'primary',
      textToken: 'textInverse',
    });
    assert.equal(getButtonTone('outline', false).transparentBackground, true);
    assert.deepEqual(getButtonTone('danger', false), {
      backgroundToken: 'error',
      borderToken: 'error',
      textToken: 'textInverse',
    });
    assert.equal(getButtonTone('primary', true).backgroundToken, 'disabled');
  });

  it('maps badge variants to semantic tokens', () => {
    assert.equal(getBadgeTone('to_read').textToken, 'textSecondary');
    assert.equal(getBadgeTone('reading').backgroundToken, 'primarySoft');
    assert.equal(getBadgeTone('read').backgroundToken, 'success');
    assert.equal(getBadgeTone('dropped').backgroundToken, 'error');
    assert.equal(getBadgeTone('active').backgroundToken, 'primarySoft');
    assert.equal(getBadgeTone('completed').backgroundToken, 'success');
    assert.equal(getBadgeTone('cancelled').backgroundToken, 'error');
  });

  it('clamps progress values for ProgressBar', () => {
    assert.equal(clampProgressValue(-10), 0);
    assert.equal(clampProgressValue(46), 46);
    assert.equal(clampProgressValue(120), 100);
  });

  it('only shows optional actions when label and handler exist', () => {
    assert.equal(shouldShowOptionalAction('Retry', true), true);
    assert.equal(shouldShowOptionalAction('Retry', false), false);
    assert.equal(shouldShowOptionalAction(undefined, true), false);
  });
});
