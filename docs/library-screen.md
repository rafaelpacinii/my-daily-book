# Library Screen

The Library area is the second functional UI backed by the public `ApplicationApi`. It is mobile-first, offline-first for local library reads, and keeps all persistence behind the application facade.

## Routes

- `/(tabs)/library`: local library list.
- `/library/[libraryBookId]`: local book details.
- `/library/add`: add-book entry point.
- `/library/manual`: manual book entry.
- `/library/search`: Google Books search.
- `/library/google-books/[volumeId]`: editable import screen for a Google Books result.

## Public API Usage

The presentation layer uses:

- `api.library.listBooks`
- `api.library.getBookDetails`
- `api.library.createManualBookDraft`
- `api.library.createDraftFromMetadata`
- `api.library.validateBookDraft`
- `api.library.findPotentialBookDuplicates`
- `api.library.addEditableBookDraftToLibrary`
- `api.library.selectLocalBookCover`
- `api.library.removeBookCover`
- `api.library.addCopy`
- `api.library.removeCopy`
- `api.googleBooks.search`
- `api.googleBooks.getById`
- `api.googleBooks.searchPossibleEditions`

No Library presentation file imports Drizzle, SQLite, schema objects, repositories, transactions, internal Google Books clients, or Google Drive clients.

## Listing

The list uses `FlatList` with stable keys and public pagination:

```ts
interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

The controller loads the first page, appends more pages without duplicate IDs, supports pull-to-refresh, and keeps the current list visible if refresh or load-more fails.

## Local Search

Local search calls `api.library.listBooks` with the `search` field after trimming and a 300 ms debounce. Pagination resets when query, filters, or sorting change.

The public library query matches:

- title;
- original title;
- author name;
- ISBN-10;
- ISBN-13.

## Filters

Filters are represented as accessible chips:

- status: all, to-read, reading, read, dropped;
- ownership: all, owned, not-owned;
- format: all, physical, digital;
- author ID: supported by the controller and public query for future picker/autocomplete work.

## Sorting

Sort options map to the public query:

- recently added: `addedAt desc`;
- title ascending: `title asc`;
- title descending: `title desc`;
- last read: `lastReadAt desc`.

The UI does not re-sort query results in memory.

## Empty And Error States

The Library distinguishes:

- empty library: `Your library is empty` with `Add your first book`;
- filtered/search empty: `No books found` with `Clear filters`;
- initial load failure: retryable full-screen error;
- refresh failure: inline retry while preserving current items;
- load-more failure: retryable footer.

## Details

Book details call `api.library.getBookDetails`. The detail screen shows:

- cover, title, original title, authors, status, progress, rating and notes when present;
- saved editions with publisher, publication date, language, page count and ISBNs;
- copies with format, label, acquired date, notes and edition title;
- summarized reading cycles and reading logs;
- lists and goals by name.

Actions outside this task, such as starting/finishing/dropping a reading cycle or recording a reading log, are not implemented here.

## Copies

The details screen includes a compact add-copy form using an existing saved edition. It validates required edition, required format, and optional civil date. It then calls `api.library.addCopy`.

Copy removal calls `api.library.removeCopy` and lets the domain/application layer enforce constraints. Duplicate copies are rejected by the public use case and shown as a user-safe failure.

## Google Books Search

The search screen submits explicitly with a required trimmed query. It uses:

- `startIndex`;
- `maxResults`;
- duplicate prevention by `googleBooksId`;
- retryable first-page and load-more errors;
- `AbortSignal` for first-page cancellation.

No Google Books result is persisted from the search list.

## Volume Details

The editable import screen calls `api.googleBooks.getById`, converts the normalized result into an editable draft, and exposes preview/info links only when they are valid `http` or `https` URLs. Links open through React Native `Linking` after explicit user action.

Possible editions are loaded only when the user presses `Find`. They are labeled as possible editions and not treated as guaranteed matches.

## Unified Draft Flow

All entry paths use the same editable form:

- manual entry starts from an empty normalized draft;
- Google Books and ISBN fallback results are converted into the same draft shape;
- the user can edit title, subtitle, authors, publisher, date, page count, language, description and ISBNs before saving;
- the user can keep the remote cover, replace it with a local image, or remove it entirely;
- local images are copied into app storage before persistence, and abandoned draft files are cleaned up when the screen leaves.

Before saving, the user must choose:

- create as a new work;
- or link to an existing local work.

The default is new work. Existing work selection uses local library results from the public API and then resolves the selected library book to its work through `getBookDetails`.

The only initial status in this task is `to_read`; no reading cycle starts automatically.

## Ownership And Copies

If the user owns the book, format is required and a physical or digital copy is created with optional label, acquired date and notes. If the user does not own the book, no `book_copy` is sent.

Manual drafts persist editions with `metadataSource='manual'`, `externalMetadataId=null`, and `googleBooksId=null`.

## Duplicate Handling

Before persistence, the application layer checks duplicates by:

- Google Books/BrasilAPI external identifiers when present;
- ISBN-13 and ISBN-10;
- existing saved editions;
- exact local work suggestions by title and authors.

Existing edition matches are reused instead of silently duplicating metadata. Copy uniqueness is still enforced by the public add-copy/add-book use cases.

UI errors are category-based and user-safe:

- conflicts: existing edition or copy;
- validation: check book/copy details;
- network: unable to reach Google Books;
- external service: unusable Google Books result;
- unknown: unable to add this book.

## Accessibility

- Search fields are labeled.
- Filter chips expose selected state.
- Cards are pressable buttons.
- Covers and placeholders expose image labels.
- Progress bars expose progress values through the base component.
- Load-more state is announced with an accessible label.
- External links are explicit buttons.

## Tests

Automated tests cover:

- Library query input mapping;
- pagination merge de-duplication;
- Library mappers for list/detail cards;
- Google Books mapper and possible-edition mapping;
- unified draft validation and duplicate handling through public API contracts;
- local cover normalization and backup serialization validation;
- query/form validation;
- add-copy validation;
- formatting helpers.

The project still does not include a React Native rendering test dependency, so screen/component render assertions are not automated yet.

## Limitations

This step does not implement reading-log forms, start/complete/drop reading cycle actions, camera ISBN scanning, OCR, wishlist/list workflows inside the add flow, backup UI for browsing cover assets, sync, notifications, Zustand, or TanStack Query.
