# ISBN fallback

This step finalizes ISBN-only fallback from Google Books to BrasilAPI.

## Search flow

The search flow is:

1. Normalize the query as ISBN when possible.
2. Query Google Books by ISBN.
3. If Google Books returns at least one valid item, return those results and do not call BrasilAPI.
4. If Google Books returns zero ISBN results, query BrasilAPI with `GET https://brasilapi.com.br/api/isbn/v1/{isbn}`.
5. If BrasilAPI returns one valid item, map it into the shared external metadata model.
6. If BrasilAPI returns `404`, return an empty result.
7. If Google Books fails because of network, quota, auth, or server errors, do not silently fallback to BrasilAPI.

Text search, title search, author search, and free-text search do not call BrasilAPI.

## BrasilAPI client

The BrasilAPI integration lives under `src/infrastructure/brasil-api`.

It uses:

- `fetch`
- optional `AbortSignal`
- typed errors for `400`, `404`, `429`, and `5xx`
- runtime validation of external JSON
- no persistence side effects

The parser validates the response object and the mapper converts BrasilAPI data into the shared `BookMetadata` shape.

## Mapping rules

The common metadata mapping is:

- `title <- title`
- `subtitle <- subtitle`
- `authors <- authors`
- `publisher <- publisher`
- `description <- synopsis`
- `pageCount <- page_count`
- `publishedDate <- year` as `YYYY`
- `coverUrl <- cover_url`
- `isbn <- normalized isbn`
- `source <- brasil_api`

Additional behavior:

- authors are trimmed
- empty authors are removed
- duplicate authors are removed
- language is not invented
- cover is not invented
- retail price is ignored
- physical format does not auto-create a copy
- ownership remains a user choice

## Metadata source persistence

Edition persistence now distinguishes metadata origin explicitly:

- `metadata_source`
- `external_metadata_id`
- `google_books_id` nullable

Expected values for `metadata_source`:

- `google_books`
- `brasil_api`
- `manual`

BrasilAPI identifiers are stored in `external_metadata_id`, not in `google_books_id`.

## Migration

The schema change is implemented by:

- [src/database/migrations/0001_charming_amphibian.sql](/home/rpacini/Dev/personal-projects/my-daily-book/src/database/migrations/0001_charming_amphibian.sql)
- [src/database/schema/editions.ts](/home/rpacini/Dev/personal-projects/my-daily-book/src/database/schema/editions.ts)
- [model.dbdiagram](/home/rpacini/Dev/personal-projects/my-daily-book/model.dbdiagram)

The migration preserves existing Google Books rows by backfilling:

- `metadata_source = 'google_books'`
- `external_metadata_id = google_books_id`

It also keeps:

- the existing `google_books_id` unique index
- a composite unique index on `(metadata_source, external_metadata_id)`
- existing ISBN indexes

## Backup and restore

Backup validation now expects the source-aware edition fields and rejects invalid combinations such as:

- non-Google metadata with `googleBooksId`
- unsupported schema versions
- duplicate external metadata keys for the same source

Backups remain replace-only and keep checksum validation intact.
