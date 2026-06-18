# Home Screen

The Home screen is the first functional UI backed by the app's public `ApplicationApi`. It lives under `src/presentation/home` and is mounted by `app/(tabs)/index.tsx`.

## Public Queries

The controller calls these public facades only:

- `api.library.getOverview()`
- `api.library.listCurrentlyReadingBooks()`
- `api.reading.getDailySummary(today)`
- `api.statistics.getReadingStreak(today)`
- `api.goals.getActiveGoals()`

The presentation layer does not import Drizzle, SQLite, schema objects, repositories, transactions, Google Books clients, or Google Drive clients.

The five reads are independent and use `Promise.all`. A technical failure rejects the whole load so the screen does not combine partially stale or partially missing numbers without saying so.

## View Model

`home-types.ts` defines `HomeViewModel` with:

- library totals: total, to-read, reading, read, dropped, and owned.
- up to three currently-reading books.
- today's pages, duration, session count, and book count.
- current and longest streak.
- up to three active goals sorted by deadline.

The public `LibraryBookSummary` read model exposes `currentPage` and `pageCount` so the Home mapper can show reading position without deriving from database entities in the UI.

## Controller

`useHomeScreen` owns:

- `idle`
- `loading`
- `refreshing`
- `success`
- `error`

It loads on mount, blocks duplicate in-flight loads with a local ref, avoids state updates after unmount, supports retry, and keeps the current view model visible when a pull-to-refresh fails.

## Sections

The screen renders:

- Header with logo, local greeting, app name, local formatted date, and settings action.
- Today's reading.
- Currently reading.
- Quick actions.
- Library overview.
- Reading streak.
- Active goals.

## States

Initial loading uses the app card style, a discreet activity indicator, and neutral placeholders. It does not show fake data.

An empty local database renders zeros and empty states:

- zero library counts;
- no reading recorded today;
- no current reading items;
- `0 days` streak;
- no active goals.

Initial load failures show `Unable to load your reading overview.` with `Try again`. Refresh failures leave the previous overview visible and show a retryable inline error.

Pull-to-refresh uses React Native `RefreshControl` with theme colors and a separate `refreshing` state.

## Formatting

Civil dates use component parsing for `YYYY-MM-DD` strings instead of `new Date('YYYY-MM-DD')`.

Duration formatting:

- `0` seconds: `0 min`
- under one minute: `< 1 min`
- minutes: `10 min`
- exact hours: `1h`
- hours and minutes: `1h 15min`

Negative durations are clamped to `0 min`.

Goal deadlines are text labels, not color alone:

- `Due in 12 days`
- `Due today`
- `Overdue by 3 days`
- `Completed`

## Navigation

Navigation uses Expo Router through the centralized `appRoutes` object:

- Browse/View library: `/(tabs)/library`
- Record reading: `/(tabs)/reading`
- View lists: `/(tabs)/lists`
- Settings icon: `/(tabs)/settings`

The Add book action is intentionally disabled until the add-book flow exists.

## Accessibility

Base buttons and interactive cards expose button roles. Progress bars expose progressbar values. Book covers and cover placeholders have descriptive labels. Overdue goal state is visible in text.

## Tests

Current Home tests cover:

- mapper behavior for empty data, real currently-reading fields, HTTPS cover validation, active goal ordering, and deadline labels;
- formatter behavior for greetings, durations, pluralization, civil dates, and deadline labels;
- controller loading, error propagation, and parallel query dispatch.

The project does not currently include a React Native render test dependency such as `react-test-renderer` or `@testing-library/react-native`, so component render assertions are not part of the automated suite yet.

## Limitations

The Home screen does not implement Library search, Google Books search UI, add-book forms, reading-log forms, goal editing, charts, backup UI, OAuth UI, remote sync, or notifications.
