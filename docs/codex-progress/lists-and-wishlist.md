# Lists and Wishlist Progress

## Status

Lists and Wishlist implementation completed for the current MVP scope and validated.

## Functionalities Completed

- Confirmed Expo SDK 54 documentation before coding.
- Replaced the Lists tab placeholder with a functional public-API-backed screen.
- Added routes for custom list creation/details/edit/add-book and wishlist/details/add-item.
- Implemented wishlist recovery/creation through `getOrCreateWishlist`.
- Implemented custom list create/edit/delete.
- Implemented adding local books to lists with optional edition selection.
- Implemented item removal and sequential reordering with Move up/Move down.
- Implemented wishlist add flow with priority, desired format, target price, currency and notes.
- Implemented wishlist item details with edit, purchase links, safe link opening, delete link, remove item and mark as purchased.
- Added pure loader and validation tests for Lists/Wishlist.
- Updated public lists API with `getItemDetails`.

## Main Files

- `app/(tabs)/lists.tsx`
- `app/lists/create.tsx`
- `app/lists/[bookListId].tsx`
- `app/lists/[bookListId]/edit.tsx`
- `app/lists/[bookListId]/add-book.tsx`
- `app/wishlist/index.tsx`
- `app/wishlist/add.tsx`
- `app/wishlist/item/[bookListItemId].tsx`
- `src/application/api/lists-api.ts`
- `src/application/queries/lists/list-queries.ts`
- `src/presentation/navigation/routes.ts`
- `src/presentation/lists/*`
- `docs/lists-and-wishlist.md`
- `docs/codex-progress/lists-and-wishlist.md`

## Commands And Results

- `git status --short`: worktree already had broad modified/untracked implementation files.
- `git diff --stat`: tracked diff showed the pre-existing broad app changes.
- `npx tsc --noEmit --pretty false`: passed, exit code `0`.
- `npm run lint`: passed, exit code `0`.
- `npm test`: passed, `32` tests, `32` pass, `0` fail.
- `npx expo install --check`: passed in offline mode using the local dependency map; dependencies are up to date.

## Limitations

- Tests use Node's built-in runner and cover pure loaders/validation instead of React Native rendering.
- Reordering uses explicit Move up/Move down controls rather than drag-and-drop.
- Add-to-wishlist uses locally known unowned library entries only; it does not add Google Books results directly.
- Purchase link opening is protocol-validated but not remotely checked.
- `npx expo install --check` warned that dependency validation is unreliable in offline mode because networking is disabled.
- The broader worktree still includes many untracked files from previous stages.

## Next Exact Point

Run manual Expo Router smoke tests for `/lists/create`, `/lists/[bookListId]`, `/lists/[bookListId]/add-book`, `/wishlist/add`, and `/wishlist/item/[bookListItemId]` on device or web with seeded local data.
