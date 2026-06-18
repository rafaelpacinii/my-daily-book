import { i18n } from '@/src/localization/i18n';
import type { BookListItemDetails } from '@/src/application';

export function formatAuthors(names: string[]): string {
  return names.length > 0 ? names.join(', ') : t('lists.formatters.unknownAuthor');
}

export function formatItemCount(count: number): string {
  return t('lists.formatters.itemCount', { count });
}

export function formatTimestamp(value: number | null | undefined): string {
  if (!value) return t('lists.formatters.notUpdatedYet');

  return new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatPrice(price: number | null | undefined, currency: string | null | undefined): string {
  if (price == null) return t('lists.formatters.noPrice');
  return `${currency ?? '---'} ${price.toFixed(2)}`;
}

export function formatPriority(priority: BookListItemDetails['item']['wishlistPriority']): string {
  if (priority === 'high') return t('lists.formatters.highPriority');
  if (priority === 'low') return t('lists.formatters.lowPriority');
  return t('lists.formatters.mediumPriority');
}

export function formatDesiredFormat(format: BookListItemDetails['item']['desiredFormat']): string {
  if (format === 'physical') return t('lists.formatters.physical');
  if (format === 'digital') return t('lists.formatters.digital');
  return t('lists.formatters.anyFormat');
}

export function normalizeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith('http://') ? value.replace('http://', 'https://') : value;
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
