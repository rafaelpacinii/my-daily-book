import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatLocalizedDate, formatLocalizedNumber } from '@/src/localization/formatters';
import { isSupportedLocale } from '@/src/localization/locale-types';
import en from '@/src/localization/locales/en';
import ptBR from '@/src/localization/locales/pt-BR';

describe('localization', () => {
  it('supports only the initial locales', () => {
    assert.equal(isSupportedLocale('en'), true);
    assert.equal(isSupportedLocale('pt-BR'), true);
    assert.equal(isSupportedLocale('es'), false);
  });

  it('keeps the same semantic keys in English and Portuguese', () => {
    assert.deepEqual(flattenKeys(en), flattenKeys(ptBR));
  });

  it('keeps essential translated values populated in English and Portuguese', () => {
    const englishEntries = flattenEntries(en);
    const portugueseEntries = flattenEntries(ptBR);

    for (const [key, value] of englishEntries) {
      assert.notEqual(value.trim(), '', `English translation is empty for ${key}`);
    }

    for (const [key, value] of portugueseEntries) {
      assert.notEqual(value.trim(), '', `Portuguese translation is empty for ${key}`);
    }
  });

  it('formats dates and numbers using the active locale', () => {
    assert.equal(formatLocalizedDate('2026-06-14', 'en'), 'June 14, 2026');
    assert.equal(formatLocalizedDate('2026-06-14', 'pt-BR'), '14 de junho de 2026');
    assert.equal(formatLocalizedNumber(1250, 'en'), '1,250');
    assert.equal(formatLocalizedNumber(1250, 'pt-BR'), '1.250');
  });
});

function flattenKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, nextValue]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    return typeof nextValue === 'object' && nextValue !== null
      ? flattenKeys(nextValue as object, nextPrefix)
      : [nextPrefix];
  }).sort();
}

function flattenEntries(value: object, prefix = ''): [string, string][] {
  return Object.entries(value).flatMap(([key, nextValue]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    if (typeof nextValue === 'object' && nextValue !== null) {
      return flattenEntries(nextValue as object, nextPrefix);
    }

    return [[nextPrefix, String(nextValue)]];
  });
}
