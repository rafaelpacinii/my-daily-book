import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { authors } from './authors';

export const works = sqliteTable(
  'works',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    originalTitle: text('original_title'),
    description: text('description'),
    originalLanguage: text('original_language'),
    firstPublishedDate: text('first_published_date'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    titleIdx: index('works_title_idx').on(table.title),
  }),
);

export const workAuthors = sqliteTable(
  'work_authors',
  {
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workId, table.authorId] }),
    workIdIdx: index('work_authors_work_id_idx').on(table.workId),
    authorIdIdx: index('work_authors_author_id_idx').on(table.authorId),
  }),
);
