import {
  createPurchaseLink,
  deletePurchaseLink,
  findPurchaseLinkById,
  listPurchaseLinksByBookListItemId,
  updatePurchaseLink as updatePurchaseLinkRecord,
} from '@/src/database/repositories/purchase-link-repository';
import { findBookListItemById } from '@/src/database/repositories/book-list-repository';
import type { DatabaseTransaction } from '@/src/database/repositories/shared';
import type { PurchaseLink } from '@/src/database/types';
import { ValidationError } from '@/src/domain/errors';
import { normalizePurchaseLinkUrl, validatePurchaseLink as validatePurchaseLinkRules } from '@/src/domain/lists';

import {
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface AddPurchaseLinkInput {
  bookListItemId: string;
  storeName?: string | null;
  url: string;
  price?: number | null;
  currency?: string | null;
  notes?: string | null;
  lastCheckedAt?: number | null;
}

export interface UpdatePurchaseLinkInput extends Partial<AddPurchaseLinkInput> {
  id: string;
}

export function addPurchaseLink(
  input: AddPurchaseLinkInput,
  dependencies?: UseCaseDependencies,
): PurchaseLink {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  const url = normalizePurchaseLinkUrl(input.url);
  validatePurchaseLinkRules(url, input.price, input.currency);

  return runUseCaseTransaction((tx) => {
    requireEntity(findBookListItemById(input.bookListItemId, tx), 'BookListItem', input.bookListItemId);
    assertPurchaseLinkUrlIsUnique(input.bookListItemId, url, null, tx);
    const timestamp = clock.now();

    return createPurchaseLink(
      {
        id: idGenerator.generate(),
        bookListItemId: input.bookListItemId,
        storeName: input.storeName ?? null,
        url,
        price: input.price ?? null,
        currency: input.currency ?? null,
        notes: input.notes ?? null,
        lastCheckedAt: input.lastCheckedAt ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
  });
}

export function updatePurchaseLink(input: UpdatePurchaseLinkInput): PurchaseLink {
  return runUseCaseTransaction((tx) => {
    const existing = requireEntity(findPurchaseLinkById(input.id, tx), 'PurchaseLink', input.id);
    const url = input.url === undefined ? existing.url : normalizePurchaseLinkUrl(input.url);
    const price = input.price === undefined ? existing.price : input.price;
    const currency = input.currency === undefined ? existing.currency : input.currency;
    validatePurchaseLinkRules(url, price, currency);
    assertPurchaseLinkUrlIsUnique(existing.bookListItemId, url, existing.id, tx);

    return requireEntity(
      updatePurchaseLinkRecord(
        input.id,
        {
          storeName: input.storeName === undefined ? existing.storeName : input.storeName,
          url,
          price,
          currency,
          notes: input.notes === undefined ? existing.notes : input.notes,
          lastCheckedAt:
            input.lastCheckedAt === undefined ? existing.lastCheckedAt : input.lastCheckedAt,
        },
        tx,
      ),
      'PurchaseLink',
      input.id,
    );
  });
}

export function removePurchaseLink(id: string): PurchaseLink {
  return runUseCaseTransaction((tx) => requireEntity(deletePurchaseLink(id, tx), 'PurchaseLink', id));
}

function assertPurchaseLinkUrlIsUnique(
  bookListItemId: string,
  url: string,
  currentId: string | null,
  tx: DatabaseTransaction,
): void {
  const duplicate = listPurchaseLinksByBookListItemId(bookListItemId, tx).find(
    (link) => link.url === url && link.id !== currentId,
  );

  if (duplicate) {
    throw new ValidationError('purchase link URL already exists for this list item.');
  }
}
