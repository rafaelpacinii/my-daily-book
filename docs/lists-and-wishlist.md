# Lists and Wishlist

The Lists area is implemented as an Expo Router flow backed by the public application API.

## Routes

- `/(tabs)/lists` shows the wishlist card and custom lists.
- `/lists/create` creates a custom list.
- `/lists/[bookListId]` shows list details, ordered items and list actions.
- `/lists/[bookListId]/edit` edits custom list metadata.
- `/lists/[bookListId]/add-book` adds local books to a custom list.
- `/wishlist` shows the single wishlist.
- `/wishlist/add` adds a local unowned book to the wishlist.
- `/wishlist/item/[bookListItemId]` shows and edits wishlist item details.

## Public API Boundary

Presentation code consumes `useApplication()` and the public facades only:

- `api.lists.listLists()`
- `api.lists.getListDetails()`
- `api.lists.getItemDetails()`
- `api.lists.getOrCreateWishlist()`
- `api.lists.createList()`
- `api.lists.updateList()`
- `api.lists.deleteList()`
- `api.lists.addItem()`
- `api.lists.removeItem()`
- `api.lists.reorderItems()`
- `api.lists.addWishlistItem()`
- `api.lists.updateWishlistItem()`
- `api.lists.markWishlistItemAsPurchased()`
- `api.lists.addPurchaseLink()`
- `api.lists.updatePurchaseLink()`
- `api.lists.removePurchaseLink()`
- `api.library.listBooks()`
- `api.library.getBookDetails()`

The only public API addition in this step is `lists.getItemDetails(bookListItemId)`, used by the wishlist item details route.

## Behaviors

- The wishlist is created or recovered through `getOrCreateWishlist()` and is shown even when empty.
- Custom lists support create, edit, delete, opening details, adding local books, removing items and reordering with Move up/Move down controls.
- Add-to-list uses local library books only and allows optional edition selection.
- Wishlist add hides already owned books, supports priority, desired format, target price, currency and notes.
- Wishlist item details support editing wishlist metadata, purchase links and marking as purchased.
- Purchase links validate safe `http`/`https` URLs locally before calling the domain and use `Linking.openURL` only after protocol validation.
- Mark as purchased creates/reuses the library book through the public wishlist use case, creates a copy and removes the wishlist item atomically.
- Screens refresh on focus or local refresh instead of adding a global cache/store.

## Validation

Frontend validation trims form fields, prevents obviously invalid input and blocks duplicate submit attempts. Domain use cases remain the final authority for duplicate list items, wishlist ownership rules, incompatible editions, duplicate URLs and duplicate copies.

## Out of Scope

Goals, statistics, backup/Drive UI, notifications, price scraping, checkout, sync, remote backend, TanStack Query and Zustand are intentionally not included.
