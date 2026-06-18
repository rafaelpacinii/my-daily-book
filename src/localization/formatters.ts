import type { SupportedLocale } from './locale-types';

export function formatLocalizedDate(value: string, locale: SupportedLocale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatLocalizedNumber(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}
