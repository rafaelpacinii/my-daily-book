import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { bookCopies } from './book-copies';
import { editions } from './editions';
import { libraryBooks } from './library-books';

export const readingCycleStatuses = ['reading', 'completed', 'dropped'] as const;

export type ReadingCycleStatus = (typeof readingCycleStatuses)[number];

export const readingCycles = sqliteTable(
  'reading_cycles',
  {
    id: text('id').primaryKey(),
    libraryBookId: text('library_book_id')
      .notNull()
      .references(() => libraryBooks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    bookCopyId: text('book_copy_id').references(() => bookCopies.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    cycleNumber: integer('cycle_number').notNull(),
    status: text('status', { enum: readingCycleStatuses }).notNull().default('reading'),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    droppedAt: text('dropped_at'),
    lastReadAt: text('last_read_at'),
    rating: integer('rating'),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    libraryBookNumberUnique: uniqueIndex('reading_cycles_library_book_number_unique').on(
      table.libraryBookId,
      table.cycleNumber,
    ),
    libraryBookIdIdx: index('reading_cycles_library_book_id_idx').on(table.libraryBookId),
    editionIdIdx: index('reading_cycles_edition_id_idx').on(table.editionId),
    bookCopyIdIdx: index('reading_cycles_book_copy_id_idx').on(table.bookCopyId),
    statusIdx: index('reading_cycles_status_idx').on(table.status),
    startedAtIdx: index('reading_cycles_started_at_idx').on(table.startedAt),
  }),
);
