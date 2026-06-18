import { EntityNotFoundError } from '@/src/database/errors';
import type { BookList, BookListItem } from '@/src/database/types';

import { findAuthorsForWork, readModelSnapshot } from '../read-model-store';
import type { BookListDetails, BookListItemDetails } from '../models';

export function listBookLists(): BookList[] {
  return readModelSnapshot().bookLists;
}

export function getBookListDetails(bookListId: string): BookListDetails {
  const snapshot = readModelSnapshot();
  const list = snapshot.bookLists.find((item) => item.id === bookListId);

  if (!list) {
    throw new EntityNotFoundError('BookList', bookListId);
  }

  return {
    list,
    items: snapshot.bookListItems
      .filter((item) => item.bookListId === list.id)
      .map((item) => buildBookListItemDetails(snapshot, item)),
  };
}

export function getBookListItemDetails(bookListItemId: string): BookListItemDetails {
  const snapshot = readModelSnapshot();
  const item = snapshot.bookListItems.find((candidate) => candidate.id === bookListItemId);

  if (!item) {
    throw new EntityNotFoundError('BookListItem', bookListItemId);
  }

  return buildBookListItemDetails(snapshot, item);
}

export function getWishlist(): BookListDetails | null {
  const wishlist = readModelSnapshot().bookLists.find((list) => list.type === 'wishlist');

  return wishlist ? getBookListDetails(wishlist.id) : null;
}

function buildBookListItemDetails(
  snapshot: ReturnType<typeof readModelSnapshot>,
  item: BookListItem,
): BookListItemDetails {
  const work = snapshot.works.find((candidate) => candidate.id === item.workId);

  if (!work) {
    throw new EntityNotFoundError('Work', item.workId);
  }

  return {
    item,
    work,
    authors: findAuthorsForWork(snapshot, work.id),
    edition: item.editionId
      ? snapshot.editions.find((edition) => edition.id === item.editionId) ?? null
      : null,
    purchaseLinks: snapshot.purchaseLinks.filter((link) => link.bookListItemId === item.id),
    owned: snapshot.libraryBooks.some((book) => book.workId === item.workId),
  };
}
