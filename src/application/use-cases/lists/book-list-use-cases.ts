import {
  createBookListRecord,
  createBookListItem,
  deleteBookList as deleteBookListRecord,
  deleteBookListItem,
  findBookListById,
  findBookListItemById,
  findBookListItemForBook,
  listBookListItems,
  listBookListsByType,
  updateBookList as updateBookListRecord,
  updateBookListItem,
} from '@/src/database/repositories/book-list-repository';
import { findEditionById, findWorkById } from '@/src/database/repositories';
import type { BookList, BookListItem } from '@/src/database/types';
import type { BookListType } from '@/src/database/schema';
import { assertSingleWishlist, assertUniqueBookListItem, validateBookListName, validateBookListPosition } from '@/src/domain/lists';
import { EditionMismatchError } from '@/src/domain/errors';

import {
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface CreateBookListInput {
  name: string;
  description?: string | null;
  type?: BookListType;
}

export interface UpdateBookListInput {
  id: string;
  name?: string;
  description?: string | null;
}

export interface AddBookToListInput {
  bookListId: string;
  workId: string;
  editionId?: string | null;
  position?: number | null;
  notes?: string | null;
}

export interface ReorderBookListItemInput {
  id: string;
  position: number;
}

export function createBookList(
  input: CreateBookListInput,
  dependencies?: UseCaseDependencies,
): BookList {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  validateBookListName(input.name);

  return runUseCaseTransaction((tx) => {
    if ((input.type ?? 'custom') === 'wishlist') {
      assertSingleWishlist(listBookListsByType('wishlist', undefined, tx).length);
    }

    const timestamp = clock.now();

    return createBookListRecord(
      {
        id: idGenerator.generate(),
        name: input.name.trim(),
        description: input.description ?? null,
        type: input.type ?? 'custom',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
  });
}

export function updateBookList(input: UpdateBookListInput): BookList {
  if (input.name !== undefined) {
    validateBookListName(input.name);
  }

  return runUseCaseTransaction((tx) => {
    const existing = requireEntity(findBookListById(input.id, tx), 'BookList', input.id);

    return requireEntity(
      updateBookListRecord(
        input.id,
        {
          name: input.name === undefined ? existing.name : input.name.trim(),
          description: input.description === undefined ? existing.description : input.description,
        },
        tx,
      ),
      'BookList',
      input.id,
    );
  });
}

export function deleteBookList(id: string): BookList {
  return runUseCaseTransaction((tx) => requireEntity(deleteBookListRecord(id, tx), 'BookList', id));
}

export function addBookToList(
  input: AddBookToListInput,
  dependencies?: UseCaseDependencies,
): BookListItem {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  validateBookListPosition(input.position);

  return runUseCaseTransaction((tx) => {
    requireEntity(findBookListById(input.bookListId, tx), 'BookList', input.bookListId);
    const work = requireEntity(findWorkById(input.workId, tx), 'Work', input.workId);

    if (input.editionId) {
      const edition = requireEntity(findEditionById(input.editionId, tx), 'Edition', input.editionId);

      if (edition.workId !== work.id) {
        throw new EditionMismatchError('edition must belong to the selected work.');
      }
    }

    assertUniqueBookListItem(
      findBookListItemForBook(input.bookListId, input.workId, input.editionId ?? null, tx) != null,
    );

    const timestamp = clock.now();

    return createBookListItem(
      {
        id: idGenerator.generate(),
        bookListId: input.bookListId,
        workId: input.workId,
        editionId: input.editionId ?? null,
        position: input.position ?? null,
        notes: input.notes ?? null,
        wishlistPriority: null,
        desiredFormat: null,
        targetPrice: null,
        targetCurrency: null,
        addedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
  });
}

export function removeBookFromList(id: string): BookListItem {
  return runUseCaseTransaction((tx) => requireEntity(deleteBookListItem(id, tx), 'BookListItem', id));
}

export function reorderBookListItems(items: ReorderBookListItemInput[]): BookListItem[] {
  items.forEach((item) => validateBookListPosition(item.position));

  return runUseCaseTransaction((tx) =>
    items.map((item) => {
      requireEntity(findBookListItemById(item.id, tx), 'BookListItem', item.id);

      return requireEntity(
        updateBookListItem(item.id, { position: item.position }, tx),
        'BookListItem',
        item.id,
      );
    }),
  );
}

export function listItemsForBookList(bookListId: string): BookListItem[] {
  return listBookListItems(bookListId);
}
