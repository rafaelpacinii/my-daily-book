import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { editions } from './editions';
import { works } from './works';

export const bookListTypes = ['custom', 'wishlist'] as const;

export type BookListType = (typeof bookListTypes)[number];

export const wishlistPriorities = ['low', 'medium', 'high'] as const;

export type WishlistPriority = (typeof wishlistPriorities)[number];

export const desiredBookFormats = ['physical', 'digital', 'any'] as const;

export type DesiredBookFormat = (typeof desiredBookFormats)[number];

export const bookLists = sqliteTable(
  'book_lists',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type', { enum: bookListTypes }).notNull().default('custom'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    nameIdx: index('book_lists_name_idx').on(table.name),
    typeIdx: index('book_lists_type_idx').on(table.type),
  }),
);

export const bookListItems = sqliteTable(
  'book_list_items',
  {
    id: text('id').primaryKey(),
    bookListId: text('book_list_id')
      .notNull()
      .references(() => bookLists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    editionId: text('edition_id').references(() => editions.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    position: integer('position'),
    notes: text('notes'),
    wishlistPriority: text('wishlist_priority', { enum: wishlistPriorities }),
    desiredFormat: text('desired_format', { enum: desiredBookFormats }),
    targetPrice: real('target_price'),
    targetCurrency: text('target_currency'),
    addedAt: integer('added_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    bookListIdIdx: index('book_list_items_list_id_idx').on(table.bookListId),
    workIdIdx: index('book_list_items_work_id_idx').on(table.workId),
    editionIdIdx: index('book_list_items_edition_id_idx').on(table.editionId),
    listWorkEditionUnique: uniqueIndex('book_list_items_list_work_edition_unique').on(
      table.bookListId,
      table.workId,
      table.editionId,
    ),
    listPositionIdx: index('book_list_items_list_position_idx').on(table.bookListId, table.position),
  }),
);
