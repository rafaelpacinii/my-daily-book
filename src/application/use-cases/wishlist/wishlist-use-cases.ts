import {
  createBookListItem,
  createBookListRecord,
  deleteBookListItem,
  findBookListItemById,
  findBookListItemForBook,
  listBookListsByType,
  updateBookListItem,
} from '@/src/database/repositories/book-list-repository';
import { createBookCopy, listBookCopiesByLibraryBookId } from '@/src/database/repositories/book-copy-repository';
import {
  createLibraryBook,
  findLibraryBookByWorkId,
} from '@/src/database/repositories/library-book-repository';
import type { DatabaseTransaction } from '@/src/database/repositories/shared';
import { findEditionById, findWorkById } from '@/src/database/repositories';
import type { BookList, BookListItem, BookCopy, LibraryBook } from '@/src/database/types';
import type { BookCopyFormat, DesiredBookFormat, WishlistPriority } from '@/src/database/schema';
import {
  assertUniqueBookListItem,
  validateBookListName,
  validateBookListPosition,
  validateWishlistItem,
} from '@/src/domain/lists';
import { EditionMismatchError, ValidationError } from '@/src/domain/errors';

import {
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface AddWishlistItemInput {
  workId: string;
  editionId?: string | null;
  position?: number | null;
  notes?: string | null;
  wishlistPriority?: WishlistPriority | null;
  desiredFormat?: DesiredBookFormat | null;
  targetPrice?: number | null;
  targetCurrency?: string | null;
}

export interface UpdateWishlistItemInput
  extends Partial<Omit<AddWishlistItemInput, 'workId' | 'editionId'>> {
  id: string;
}

export interface MarkWishlistItemAsPurchasedInput {
  id: string;
  editionId?: string | null;
  format: BookCopyFormat;
  label?: string | null;
  notes?: string | null;
  acquiredAt?: string | null;
}

export interface MarkWishlistItemAsPurchasedResult {
  libraryBook: LibraryBook;
  copy: BookCopy;
  removedWishlistItem: BookListItem;
}

export function getOrCreateWishlist(dependencies?: UseCaseDependencies): BookList {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const existing = listBookListsByType('wishlist', undefined, tx)[0];

    if (existing) {
      return existing;
    }

    const timestamp = clock.now();

    return createBookListRecord(
      {
        id: idGenerator.generate(),
        name: 'Wishlist',
        description: null,
        type: 'wishlist',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
  });
}

export function addWishlistItem(
  input: AddWishlistItemInput,
  dependencies?: UseCaseDependencies,
): BookListItem {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  validateBookListPosition(input.position);

  return runUseCaseTransaction((tx) => {
    const wishlist = listBookListsByType('wishlist', undefined, tx)[0] ?? createWishlist(clock.now(), idGenerator.generate(), tx);
    const work = requireEntity(findWorkById(input.workId, tx), 'Work', input.workId);
    const libraryBook = findLibraryBookByWorkId(work.id, tx);
    const edition = input.editionId
      ? requireEntity(findEditionById(input.editionId, tx), 'Edition', input.editionId)
      : null;

    if (edition && edition.workId !== work.id) {
      throw new EditionMismatchError('edition must belong to the selected work.');
    }

    const copies = libraryBook ? listBookCopiesByLibraryBookId(libraryBook.id, tx) : [];
    validateWishlistItem({
      priority: input.wishlistPriority,
      desiredFormat: input.desiredFormat,
      targetPrice: input.targetPrice,
      targetCurrency: input.targetCurrency,
      hasSpecificEdition: input.editionId != null,
      ownsWork: libraryBook != null && copies.length > 0,
      ownsEdition: input.editionId != null && copies.some((copy) => copy.editionId === input.editionId),
    });
    assertUniqueBookListItem(
      findBookListItemForBook(wishlist.id, work.id, input.editionId ?? null, tx) != null,
    );

    const timestamp = clock.now();

    return createBookListItem(
      {
        id: idGenerator.generate(),
        bookListId: wishlist.id,
        workId: work.id,
        editionId: input.editionId ?? null,
        position: input.position ?? null,
        notes: input.notes ?? null,
        wishlistPriority: input.wishlistPriority ?? 'medium',
        desiredFormat: input.desiredFormat ?? 'any',
        targetPrice: input.targetPrice ?? null,
        targetCurrency: input.targetCurrency ?? null,
        addedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
  });
}

export function updateWishlistItem(input: UpdateWishlistItemInput): BookListItem {
  validateBookListPosition(input.position);

  return runUseCaseTransaction((tx) => {
    const item = requireEntity(findBookListItemById(input.id, tx), 'BookListItem', input.id);
    validateWishlistItem({
      priority: input.wishlistPriority,
      desiredFormat: input.desiredFormat,
      targetPrice: input.targetPrice,
      targetCurrency: input.targetCurrency,
      hasSpecificEdition: item.editionId != null,
      ownsWork: false,
      ownsEdition: false,
    });

    return requireEntity(
      updateBookListItem(
        input.id,
        {
          position: input.position === undefined ? item.position : input.position,
          notes: input.notes === undefined ? item.notes : input.notes,
          wishlistPriority:
            input.wishlistPriority === undefined ? item.wishlistPriority : input.wishlistPriority,
          desiredFormat: input.desiredFormat === undefined ? item.desiredFormat : input.desiredFormat,
          targetPrice: input.targetPrice === undefined ? item.targetPrice : input.targetPrice,
          targetCurrency:
            input.targetCurrency === undefined ? item.targetCurrency : input.targetCurrency,
        },
        tx,
      ),
      'BookListItem',
      input.id,
    );
  });
}

export function markWishlistItemAsPurchased(
  input: MarkWishlistItemAsPurchasedInput,
  dependencies?: UseCaseDependencies,
): MarkWishlistItemAsPurchasedResult {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const item = requireEntity(findBookListItemById(input.id, tx), 'BookListItem', input.id);
    const editionId = input.editionId ?? item.editionId;

    if (!editionId) {
      throw new ValidationError('edition is required to mark wishlist item as purchased.');
    }

    const edition = requireEntity(findEditionById(editionId, tx), 'Edition', editionId);

    if (edition.workId !== item.workId) {
      throw new EditionMismatchError('edition must belong to the wishlist work.');
    }

    const timestamp = clock.now();
    const libraryBook =
      findLibraryBookByWorkId(item.workId, tx) ??
      createLibraryBook(
        {
          id: idGenerator.generate(),
          workId: item.workId,
          status: 'to_read',
          rating: null,
          notes: null,
          addedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        tx,
      );
    const copy = createBookCopy(
      {
        id: idGenerator.generate(),
        libraryBookId: libraryBook.id,
        editionId,
        format: input.format,
        label: input.label ?? null,
        notes: input.notes ?? null,
        acquiredAt: input.acquiredAt ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
    const removedWishlistItem = requireEntity(
      deleteBookListItem(item.id, tx),
      'BookListItem',
      item.id,
    );

    return { libraryBook, copy, removedWishlistItem };
  });
}

function createWishlist(timestamp: number, id: string, tx: DatabaseTransaction): BookList {
  validateBookListName('Wishlist');

  return createBookListRecord(
    {
      id,
      name: 'Wishlist',
      description: null,
      type: 'wishlist',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    tx,
  );
}
