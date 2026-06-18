import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { bookListItems } from './book-lists';

export const purchaseLinks = sqliteTable(
  'purchase_links',
  {
    id: text('id').primaryKey(),
    bookListItemId: text('book_list_item_id')
      .notNull()
      .references(() => bookListItems.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    storeName: text('store_name'),
    url: text('url').notNull(),
    price: real('price'),
    currency: text('currency'),
    notes: text('notes'),
    lastCheckedAt: integer('last_checked_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    bookListItemIdIdx: index('purchase_links_book_list_item_id_idx').on(table.bookListItemId),
    storeNameIdx: index('purchase_links_store_name_idx').on(table.storeName),
    itemUrlUnique: uniqueIndex('purchase_links_item_url_unique').on(
      table.bookListItemId,
      table.url,
    ),
  }),
);
