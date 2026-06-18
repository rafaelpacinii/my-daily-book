import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { editions } from './editions';
import { libraryBooks } from './library-books';

export const bookCopyFormats = ['physical', 'digital'] as const;

export type BookCopyFormat = (typeof bookCopyFormats)[number];

export const bookCopies = sqliteTable(
  'book_copies',
  {
    id: text('id').primaryKey(),
    libraryBookId: text('library_book_id')
      .notNull()
      .references(() => libraryBooks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    format: text('format', { enum: bookCopyFormats }).notNull(),
    label: text('label'),
    notes: text('notes'),
    acquiredAt: text('acquired_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    libraryBookIdIdx: index('book_copies_library_book_id_idx').on(table.libraryBookId),
    editionIdIdx: index('book_copies_edition_id_idx').on(table.editionId),
    formatIdx: index('book_copies_format_idx').on(table.format),
    libraryEditionFormatUnique: uniqueIndex('book_copies_library_edition_format_unique').on(
      table.libraryBookId,
      table.editionId,
      table.format,
    ),
  }),
);
