import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatBookFormat,
  formatCopyCount,
  formatDuration,
  formatLibraryStatus,
  isHttpUrl,
  isValidCivilDate,
  normalizeHttpsUrl,
  trimOptional,
} from '@/src/presentation/library/library-formatters';

describe('library formatters', () => {
  it('formats labels and counts', () => {
    assert.equal(formatLibraryStatus('to_read'), 'To read');
    assert.equal(formatBookFormat('physical'), 'Physical');
    assert.equal(formatCopyCount(0), 'No copies');
    assert.equal(formatCopyCount(1), '1 copy');
    assert.equal(formatCopyCount(2), '2 copies');
  });

  it('formats durations safely', () => {
    assert.equal(formatDuration(-1), '0 min');
    assert.equal(formatDuration(45), '< 1 min');
    assert.equal(formatDuration(600), '10 min');
    assert.equal(formatDuration(4500), '1h 15min');
  });

  it('validates URLs and civil dates', () => {
    assert.equal(normalizeHttpsUrl('https://example.com/a.png'), 'https://example.com/a.png');
    assert.equal(normalizeHttpsUrl('http://example.com/a.png'), 'https://example.com/a.png');
    assert.equal(normalizeHttpsUrl('file:///covers/a.png'), 'file:///covers/a.png');
    assert.equal(normalizeHttpsUrl('content://media/external/images/media/1'), 'content://media/external/images/media/1');
    assert.equal(isHttpUrl('http://example.com'), true);
    assert.equal(isHttpUrl('ftp://example.com'), false);
    assert.equal(isValidCivilDate('2026-06-15'), true);
    assert.equal(isValidCivilDate('2026-02-31'), false);
    assert.equal(trimOptional('  copy  '), 'copy');
    assert.equal(trimOptional('   '), null);
  });
});
