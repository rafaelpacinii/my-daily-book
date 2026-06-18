# Application API

The frontend should initialize the local backend once and consume the returned `ApplicationApi`.

```ts
import { initializeApplication } from '@/src/application';

const { api } = await initializeApplication();
const books = await api.library.listBooks({ status: 'reading' });
```

## Structure

`ApplicationApi` exposes seven facades:

- `library`: library overview, book lists/details, manual or external editable book drafts, book creation, metadata, copies and safe removal.
- `reading`: active cycles, cycle details, history, logs by date/range, daily summary and reading mutations.
- `lists`: custom lists, wishlist, purchase links and list item ordering.
- `goals`: reading goals, progress, item completion and recalculation.
- `statistics`: general, period, streak, book, author and format statistics.
- `googleBooks`: search, volume lookup, ISBN lookup and preparing a selected volume for persistence.
- `backup`: local backup/import/restore and Google Drive backup operations.

Do not import Drizzle tables, repositories, database clients or infrastructure clients from UI code.

## Initialization

`initializeApplication()` applies SQLite initialization/migrations, validates required public Google Books config and returns a stable API instance. Concurrent calls share the same promise. A failed initialization clears the pending promise and the next call can retry. Failures are rethrown as `ApplicationInitializationError` with the original cause preserved.

## Models

Read queries return stable TypeScript models such as `LibraryBookSummary`, `LibraryBookDetails`, `ReadingCycleDetails`, `ReadingLogSummary`, `BookListDetails`, `ReadingGoalDetails` and `ReadingStatistics`. These models are plain data objects with explicit nullable fields.

`LibraryBookSummary` includes `currentPage`, `pageCount`, `isbn10`, `isbn13`, `progressPercentage`, and `coverUrl` for presentation screens that need reading position, ISBN search and cover display without importing repositories or schema objects.

## Pagination

List queries that can grow use:

```ts
interface PaginationInput {
  limit?: number;
  offset?: number;
}
```

Limits default to `50`, are capped at `200`, and offsets are clamped to `0`. Paginated results include `items`, `total`, `limit`, `offset` and `hasMore`.

## Dates and Time

Civil dates use `YYYY-MM-DD`. Timestamps stored by the local database are numbers. Reading page totals use inclusive ranges, so `start_page=1` and `end_page=53` means `53` pages.

## Status and Progress

`library_books.status` is recalculated by reading mutations. Active cycles produce `reading`; completed history produces `read`; a latest dropped cycle without a completion produces `dropped`; no cycles produce `to_read`.

Reading goal progress is calculated from goal items and completed cycles in the goal date range. Cancelled goals stay cancelled.

## Google Books

Google Books results are external suggestions. Searching or fetching a volume never persists data automatically. Persistence happens only when the frontend passes a selected result into the library add flow.

## Editable Library Drafts

The library facade also exposes the draft workflow used by manual entry and editable import:

- `createManualBookDraft`
- `createDraftFromMetadata`
- `validateBookDraft`
- `findPotentialBookDuplicates`
- `addEditableBookDraftToLibrary`
- `selectLocalBookCover`
- `removeBookCover`
- `discardDraftLocalBookCover`

All library entry paths now converge into the same editable draft model before persistence:

- manual entry creates a draft with `metadataSource='manual'`;
- Google Books and BrasilAPI results are normalized into the same draft shape;
- duplicate checks run before save using ISBN, external identifiers, existing editions and existing works;
- local cover images are copied into app storage instead of persisting temporary picker URIs.

## Backup

Backup operations validate checksum and schema before restore. Restore is replace-only and creates a safety backup by default. Google Drive uses `appDataFolder`.

Backup schema version `3` adds local cover support. Persisted local covers are serialized as explicit `coverAssets` entries containing base64 content and restored back into app storage during import, so backups do not depend on stale device `file://` paths.

## Errors

Use normal return values for success and typed exceptions for failure. Expected categories include validation, not found, conflict, authentication, network, external service, database and backup errors. UI copy belongs in the frontend, not in this layer.

## Known Limitation

The current database client opens Expo SQLite at module import time because the existing repository layer was built that way. The frontend should still treat `initializeApplication()` as the only supported entry point; a later internal refactor can make the database client fully lazy without changing this public API.
