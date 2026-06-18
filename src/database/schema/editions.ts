import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { works } from './works';

export const editions = sqliteTable(
  'editions',
  {
    id: text('id').primaryKey(),
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    metadataSource: text('metadata_source').notNull().default('google_books'),
    externalMetadataId: text('external_metadata_id'),
    googleBooksId: text('google_books_id').unique(),
    googleBooksEtag: text('google_books_etag'),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description'),
    publisher: text('publisher'),
    publishedDate: text('published_date'),
    pageCount: integer('page_count'),
    language: text('language'),
    printType: text('print_type'),
    isbn10: text('isbn_10'),
    isbn13: text('isbn_13'),
    thumbnailUrl: text('thumbnail_url'),
    smallThumbnailUrl: text('small_thumbnail_url'),
    coverSource: text('cover_source').notNull().default('remote'),
    coverMimeType: text('cover_mime_type'),
    coverFileName: text('cover_file_name'),
    coverUrl: text('cover_url'),
    previewLink: text('preview_link'),
    infoLink: text('info_link'),
    canonicalVolumeLink: text('canonical_volume_link'),
    metadataFetchedAt: integer('metadata_fetched_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    workIdIdx: index('editions_work_id_idx').on(table.workId),
    metadataSourceExternalIdIdx: uniqueIndex('editions_metadata_source_external_id_unique').on(
      table.metadataSource,
      table.externalMetadataId,
    ),
    titleIdx: index('editions_title_idx').on(table.title),
    isbn10Idx: index('editions_isbn_10_idx').on(table.isbn10),
    isbn13Idx: index('editions_isbn_13_idx').on(table.isbn13),
  }),
);
