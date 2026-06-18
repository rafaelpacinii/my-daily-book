import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const authors = sqliteTable(
  'authors',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    nameIdx: index('authors_name_idx').on(table.name),
  }),
);
