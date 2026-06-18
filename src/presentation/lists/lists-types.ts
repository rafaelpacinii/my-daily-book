import type { BookListDetails, BookListItemDetails } from '@/src/application';
import type { LibraryBookViewModel } from '@/src/presentation/library/library-types';

type WishlistPriority = NonNullable<BookListItemDetails['item']['wishlistPriority']>;
type DesiredBookFormat = NonNullable<BookListItemDetails['item']['desiredFormat']>;

export interface BookListSummaryViewModel {
  id: string;
  name: string;
  description: string | null;
  type: 'custom' | 'wishlist';
  itemCount: number;
  itemCountLabel: string;
  updatedAtLabel: string;
}

export interface BookListItemViewModel {
  id: string;
  workId: string;
  editionId: string | null;
  title: string;
  authors: string;
  editionLabel: string;
  coverUrl: string | null;
  position: number | null;
  positionLabel: string;
  notes: string | null;
  owned: boolean;
  ownedLabel: string;
  priority: WishlistPriority | null;
  priorityLabel: string;
  desiredFormat: DesiredBookFormat | null;
  desiredFormatLabel: string;
  targetPrice: number | null;
  targetCurrency: string | null;
  targetPriceLabel: string;
  purchaseLinks: PurchaseLinkViewModel[];
}

export interface PurchaseLinkViewModel {
  id: string;
  storeName: string;
  url: string;
  price: number | null;
  currency: string | null;
  priceLabel: string;
  notes: string | null;
  lastCheckedAt: number | null;
}

export interface BookListDetailsViewModel extends BookListSummaryViewModel {
  items: BookListItemViewModel[];
}

export interface ListsHomeViewModel {
  wishlist: BookListDetailsViewModel;
  customLists: BookListSummaryViewModel[];
}

export interface AddListItemViewModel {
  books: LibraryBookViewModel[];
  editions: { id: string; title: string; meta: string }[];
}

export type BookListDetailsResult = BookListDetails;
export type BookListItemDetailsResult = BookListItemDetails;
export type WishlistPriorityValue = WishlistPriority;
export type DesiredBookFormatValue = DesiredBookFormat;
export type PurchaseFormatValue = 'physical' | 'digital';
