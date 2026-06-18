import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { libraryBooks } from './library-books';

export const readingGoalStatuses = ['active', 'completed', 'cancelled'] as const;

export type ReadingGoalStatus = (typeof readingGoalStatuses)[number];

export const readingGoals = sqliteTable(
  'reading_goals',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    startDate: text('start_date').notNull(),
    targetDate: text('target_date').notNull(),
    status: text('status', { enum: readingGoalStatuses }).notNull().default('active'),
    completedAt: text('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    statusIdx: index('reading_goals_status_idx').on(table.status),
    targetDateIdx: index('reading_goals_target_date_idx').on(table.targetDate),
    statusTargetDateIdx: index('reading_goals_status_target_date_idx').on(
      table.status,
      table.targetDate,
    ),
  }),
);

export const readingGoalItems = sqliteTable(
  'reading_goal_items',
  {
    id: text('id').primaryKey(),
    readingGoalId: text('reading_goal_id')
      .notNull()
      .references(() => readingGoals.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    libraryBookId: text('library_book_id')
      .notNull()
      .references(() => libraryBooks.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    position: integer('position'),
    completedAt: text('completed_at'),
    addedAt: integer('added_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    goalBookUnique: uniqueIndex('reading_goal_items_goal_book_unique').on(
      table.readingGoalId,
      table.libraryBookId,
    ),
    readingGoalIdIdx: index('reading_goal_items_goal_id_idx').on(table.readingGoalId),
    libraryBookIdIdx: index('reading_goal_items_library_book_id_idx').on(table.libraryBookId),
    goalPositionIdx: index('reading_goal_items_goal_position_idx').on(
      table.readingGoalId,
      table.position,
    ),
  }),
);
