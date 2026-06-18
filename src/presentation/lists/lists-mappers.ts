import type { BookListDetails, BookListItemDetails } from '@/src/application';
import { i18n } from '@/src/localization/i18n';
import { mapLibraryBookSummary } from '@/src/presentation/library/library-mappers';
import type { LibraryBookSummaryResult } from '@/src/presentation/reading/reading-types';

import {
  formatAuthors,
  formatDesiredFormat,
  formatItemCount,
  formatPrice,
  formatPriority,
  formatTimestamp,
  normalizeHttpsUrl,
} from './lists-formatters';
import type {
  BookListDetailsViewModel,
  BookListItemViewModel,
  BookListSummaryViewModel,
  PurchaseLinkViewModel,
} from './lists-types';

export function mapBookListSummary(list: BookListDetails['list'], itemCount: number): BookListSummaryViewModel {
  return {
    id: list.id,
    name: list.name,
    description: list.description,
    type: list.type,
    itemCount,
    itemCountLabel: formatItemCount(itemCount),
    updatedAtLabel: t('lists.formatters.updatedAt', { date: formatTimestamp(list.updatedAt) }),
  };
}

export function mapBookListDetails(details: BookListDetails): BookListDetailsViewModel {
  const items = [...details.items].sort(compareItems).map(mapBookListItem);

  return {
    ...mapBookListSummary(details.list, items.length),
    items,
  };
}

export function mapBookListItem(details: BookListItemDetails): BookListItemViewModel {
  const position = details.item.position;

  return {
    id: details.item.id,
    workId: details.work.id,
    editionId: details.item.editionId,
    title: details.work.title,
    authors: formatAuthors(details.authors.map((author) => author.name)),
    editionLabel: details.edition ? details.edition.title : 'Any edition',
    coverUrl: normalizeHttpsUrl(details.edition?.coverUrl ?? details.edition?.thumbnailUrl),
    position,
    positionLabel: position == null ? 'Unpositioned' : `Position ${position + 1}`,
    notes: details.item.notes,
    owned: details.owned,
    ownedLabel: details.owned ? 'Owned' : 'Not owned',
    priority: details.item.wishlistPriority,
    priorityLabel: formatPriority(details.item.wishlistPriority),
    desiredFormat: details.item.desiredFormat,
    desiredFormatLabel: formatDesiredFormat(details.item.desiredFormat),
    targetPrice: details.item.targetPrice,
    targetCurrency: details.item.targetCurrency,
    targetPriceLabel: formatPrice(details.item.targetPrice, details.item.targetCurrency),
    purchaseLinks: details.purchaseLinks.map(mapPurchaseLink),
  };
}

export function mapLibraryBooksForLists(items: LibraryBookSummaryResult[]) {
  return items.map(mapLibraryBookSummary);
}

function mapPurchaseLink(link: BookListItemDetails['purchaseLinks'][number]): PurchaseLinkViewModel {
  return {
    id: link.id,
    storeName: link.storeName ?? 'Purchase link',
    url: link.url,
    price: link.price,
    currency: link.currency,
    priceLabel: formatPrice(link.price, link.currency),
    notes: link.notes,
    lastCheckedAt: link.lastCheckedAt,
  };
}

function compareItems(left: BookListItemDetails, right: BookListItemDetails): number {
  const leftPosition = left.item.position ?? Number.MAX_SAFE_INTEGER;
  const rightPosition = right.item.position ?? Number.MAX_SAFE_INTEGER;
  if (leftPosition !== rightPosition) return leftPosition - rightPosition;
  return left.item.addedAt - right.item.addedAt;
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
