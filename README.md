# My Daily Book

My Daily Book is an Expo React Native app for keeping a local reading library, reading history, lists, goals, and backup files.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Frontend foundation

The app now has a reusable visual foundation for Expo Router screens:

- Theme tokens live under `src/theme` with light and dark palettes based on deep green, sage, cream, terracotta, and graphite.
- Presentation providers live under `src/presentation` and expose `AppThemeProvider`, `useAppTheme`, `ApplicationProvider`, and `useApplication`.
- Reusable components live under `src/components`, including `Screen`, `AppHeader`, `AppLogo`, `AppText`, `Button`, `IconButton`, `Card`, `Badge`, `ProgressBar`, `Divider`, `LoadingState`, `ErrorState`, `EmptyState`, and `SectionHeader`.
- The Expo Router shell has five tabs: Home, Library, Reading, Lists, and Settings.
- `ApplicationBootstrapGate` shows the app logo while `initializeApplication` prepares the public `ApplicationApi`, then renders a retryable visual error state if initialization fails.
- The current brand logo is loaded from `assets/images/logo.png`.

See [docs/design-system.md](docs/design-system.md) for token names, component boundaries, navigation structure, initialization behavior, and current UI boundaries.

The Home tab is connected to the public local `ApplicationApi` and renders the real reading overview, daily summary, currently-reading books, reading streak, active goals, loading, retry, empty, and pull-to-refresh states. See [docs/home-screen.md](docs/home-screen.md).

The Library tab is also functional. It supports local listing, search, filters, sorting, pagination, book details, editions, copies, summarized reading history, adding copies, Google Books search, volume confirmation, and adding a confirmed Google Books edition to the local library. See [docs/library-screen.md](docs/library-screen.md).

The Reading tab is functional for active cycles, start reading, log creation/edit/delete, history, completion, dropping, rereads, progress, daily summary, loading, error and empty states. See [docs/reading-screen.md](docs/reading-screen.md).

The remaining Lists and Settings tabs are intentionally visual shells. They do not implement charts, backup controls, OAuth UI, Zustand stores, TanStack Query, or additional business workflows yet.

Validation commands for this frontend foundation:

```bash
npx tsc --noEmit --pretty false
npm run lint
npm test
npx expo install --check
```

## Local data layer

The local data layer lives under `src/database`. Repositories provide typed Drizzle queries for one persistence area at a time and keep the convention that `find...` functions return `null` when no record exists. Transaction functions compose those repositories for atomic writes that must succeed or fail together.

Domain rules are intentionally minimal here: repositories do not implement UI behavior, external API calls, Google Books access, synchronization, or user-facing messages. Integrations and higher-level business validation should happen outside database transactions.

## Domain and application layers

The project separates pure domain rules in `src/domain`, application orchestration in `src/application`, and SQLite persistence in `src/database`. Domain code does not import React, navigation, Expo Router, environment variables, Drizzle, or HTTP clients.

The local backend exposes a single public frontend entry point through `initializeApplication` from `src/application`. UI code should consume the returned `ApplicationApi` facades instead of importing repositories, Drizzle tables, SQLite clients, SecureStore wrappers, or infrastructure clients directly. See [docs/application-api.md](docs/application-api.md) for the public read models, pagination contract, bootstrap behavior, errors, and usage examples.

Civil dates use the `YYYY-MM-DD` format and are validated by string components instead of implicit UTC parsing. Reading logs can be retroactive, but future reading dates are rejected and cycle bounds are respected.

Page ranges are inclusive, so `1-53` means 53 pages. Reading progress is calculated in memory from the highest valid logged page and is not persisted as a percentage.

`library_books.status` is summarized centrally: active cycles make the book `reading`, any completed cycle keeps it `read`, a latest dropped cycle can make it `dropped`, and books without cycles remain `to_read`. Re-readings increment `cycle_number`; a dropped re-reading does not erase the fact that the work was already read.

Lists support custom lists and a single wishlist. Wishlist items are only for books that are not already owned, purchase links are validated locally, and no URL is fetched by the domain/application layer.

Reading goals validate civil date ranges, prevent duplicate books in the same goal, keep cancelled goals explicit, and derive completion from goal items and completed cycles in the goal period.

## Google Books integration

Google Books access is isolated under `src/infrastructure/google-books` and exposed to the application through `src/application/use-cases/google-books`. It requires `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` and `EXPO_PUBLIC_GOOGLE_BOOKS_API_URL`; the base endpoint is normalized without a trailing slash and the key is never printed.

Search results are external, normalized objects. They are not saved to SQLite automatically. Persistence only happens when a caller explicitly maps a selected `GoogleBooksVolume` into the library input and calls the library use case.

Search supports free text and the Google Books operators `intitle:`, `inauthor:`, `inpublisher:` and `isbn:`. ISBN input is normalized by removing spaces and hyphens and uppercasing `x`; invalid or absent ISBNs return `null`.

Cover URLs from Google Books image fields are normalized from `http` to `https` when they belong to Google Books image hosts. The best cover is selected from `extraLarge`, `large`, `medium`, `thumbnail`, then `smallThumbnail`.

All async operations accept `AbortSignal`. Possible-edition results are scored suggestions based on simple title, author, ISBN, language, publisher and publication-date signals; they are not treated as definitive matches and are never grouped automatically in the database.

## Backup and restore

Backup support lives under `src/domain/backup`, `src/infrastructure/backup`, `src/infrastructure/google-drive`, and `src/application/use-cases/backup`. It is intentionally a data/export layer only: no screens, hooks, Zustand stores, TanStack Query setup, backend synchronization, merge workflow, or conflict resolution were added.

Backup files use JSON with a top-level `manifest`, `data`, and `checksum`. The manifest records the app name, backup format version, database schema version, export timestamp, platform, and app version. The checksum is a SHA-256 digest of the canonicalized `manifest` and `data`, so import and restore can reject tampered or truncated files before touching SQLite.

The exported data includes all current local collections: authors, works, work authors, library books, reading cycles, reading logs, custom lists, list items, wishlist items, purchase links, reading goals, and reading goal items. Restore uses a replace strategy inside a database transaction, deleting application tables from children to parents and inserting parents to children while leaving migration metadata untouched.

Local backup files use the `.mdb-backup.json` suffix and are written under the app documents backup directory. The file service validates file names, blocks path traversal, limits imports to 25 MB, supports document picking, sharing, listing, reading, and deleting controlled backup files.

Google Drive backup uses the Drive `appDataFolder` scope only. Configure these public OAuth client IDs before connecting a user account:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

The Google auth client uses Expo AuthSession with PKCE, stores tokens in Expo SecureStore, refreshes access tokens when possible, and revokes tokens on disconnect. Drive operations upload multipart JSON backups, list app-owned backups, download backup content, delete backup files, and restore a downloaded backup after validation.

Because this feature uses native Expo modules such as DocumentPicker, FileSystem, SecureStore, AuthSession, and Sharing, validate the full device flow in a development build. Expo Go may be useful for unrelated project work, but it is not the target runtime for confirming this backup workflow end to end.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
