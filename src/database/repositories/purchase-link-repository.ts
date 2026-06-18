import { asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { purchaseLinks } from '../schema/purchase-links';
import type { NewPurchaseLink, PurchaseLink } from '../types';
import {
  deleteAndRead,
  firstOrNull,
  insertAndRead,
  nowTimestamp,
  sanitizePersistenceRecord,
  type DatabaseExecutor,
  runDatabaseOperation,
  updateAndRead,
} from './shared';

export type UpdatePurchaseLinkInput = Partial<Omit<NewPurchaseLink, 'id' | 'createdAt'>>;

export function createPurchaseLink(
  input: NewPurchaseLink,
  executor: DatabaseExecutor = db,
): PurchaseLink {
  return runDatabaseOperation(() =>
    insertAndRead(
      () => {
        executor.insert(purchaseLinks).values(sanitizePersistenceRecord(input)).run();
      },
      () => findPurchaseLinkById(input.id, executor),
    ),
  );
}

export function findPurchaseLinkById(
  id: string,
  executor: DatabaseExecutor = db,
): PurchaseLink | null {
  return firstOrNull(
    executor.select().from(purchaseLinks).where(eq(purchaseLinks.id, id)).limit(1).all(),
  );
}

export function listPurchaseLinksByBookListItemId(
  bookListItemId: string,
  executor: DatabaseExecutor = db,
): PurchaseLink[] {
  return executor
    .select()
    .from(purchaseLinks)
    .where(eq(purchaseLinks.bookListItemId, bookListItemId))
    .orderBy(asc(purchaseLinks.storeName), asc(purchaseLinks.id))
    .all();
}

export function updatePurchaseLink(
  id: string,
  input: UpdatePurchaseLinkInput,
  executor: DatabaseExecutor = db,
): PurchaseLink | null {
  return runDatabaseOperation(() =>
    updateAndRead(
      () => {
        executor
          .update(purchaseLinks)
          .set(sanitizePersistenceRecord({ ...input, updatedAt: nowTimestamp() }))
          .where(eq(purchaseLinks.id, id))
          .run();
      },
      () => findPurchaseLinkById(id, executor),
    ),
  );
}

export function deletePurchaseLink(
  id: string,
  executor: DatabaseExecutor = db,
): PurchaseLink | null {
  return runDatabaseOperation(() =>
    deleteAndRead(
      () => findPurchaseLinkById(id, executor),
      () => {
        executor.delete(purchaseLinks).where(eq(purchaseLinks.id, id)).run();
      },
    ),
  );
}
