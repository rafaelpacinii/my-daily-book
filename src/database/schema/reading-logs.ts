import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { readingCycles } from './reading-cycles';

export const readingLogs = sqliteTable(
  'reading_logs',
  {
    id: text('id').primaryKey(),
    readingCycleId: text('reading_cycle_id')
      .notNull()
      .references(() => readingCycles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    readingDate: text('reading_date').notNull(),
    startPage: integer('start_page').notNull(),
    endPage: integer('end_page').notNull(),
    durationSeconds: integer('duration_seconds'),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    readingCycleIdIdx: index('reading_logs_reading_cycle_id_idx').on(table.readingCycleId),
    readingDateIdx: index('reading_logs_reading_date_idx').on(table.readingDate),
    cycleDateIdx: index('reading_logs_cycle_date_idx').on(table.readingCycleId, table.readingDate),
  }),
);
