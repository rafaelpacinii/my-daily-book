import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { works } from './works';

export const libraryBookStatuses = ['to_read', 'reading', 'read', 'dropped'] as const;

export type LibraryBookStatus = (typeof libraryBookStatuses)[number];

export const libraryBooks = sqliteTable(
  'library_books',
  {
    id: text('id').primaryKey(),
    workId: text('work_id')
      .notNull()
      .unique()
      .references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: text('status', { enum: libraryBookStatuses }).notNull().default('to_read'),
    rating: integer('rating'),
    notes: text('notes'),
    addedAt: integer('added_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    statusIdx: index('library_books_status_idx').on(table.status),
  }),
);
