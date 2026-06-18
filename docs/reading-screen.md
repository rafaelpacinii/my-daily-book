# Reading Screen

The Reading area is implemented as a functional Expo Router flow backed only by the public application API.

## Routes

- `/(tabs)/reading` shows the daily summary, active cycles and recent history.
- `/reading/start` starts a reading cycle from a saved library book.
- `/reading/cycle/[readingCycleId]` shows cycle details, logs, progress and active-cycle actions.
- `/reading/cycle/[readingCycleId]/log` creates a daily reading log.
- `/reading/log/[readingLogId]/edit` edits or deletes a log.
- `/reading/history` lists reading cycles with status and date filters.
- `/reading/history/[readingCycleId]` opens a read-only cycle detail from history.

## Public API Boundary

Presentation code uses `useApplication()` and the public facades only:

- `api.reading.listActiveCycles()`
- `api.reading.getCycleDetails()`
- `api.reading.getLogDetails()`
- `api.reading.getDailySummary()`
- `api.reading.listHistory()`
- `api.reading.startCycle()`
- `api.reading.createLog()`
- `api.reading.updateLog()`
- `api.reading.deleteLog()`
- `api.reading.completeCycle()`
- `api.reading.dropCycle()`
- `api.library.listBooks()`
- `api.library.getBookDetails()`

The presentation layer does not import repositories, Drizzle, SQLite, transactions or schema clients.

## Behaviors

- Active books show title, authors, edition, optional copy, cycle number, current page, page count, last read date, progress, total pages, duration and reading days.
- Unknown progress is displayed as unavailable instead of being treated as zero.
- Start reading blocks books with active cycles, allows rereads, requires an edition and supports no owned copy.
- Logs support multiple records on the same date, inclusive page counts, optional duration, notes, edit and delete.
- Duration inputs use hours and minutes; zero duration is normalized to no stored duration.
- Domain continuity and overlap errors require an explicit save-again confirmation through the public override flags.
- Completing and dropping cycles use the existing public use cases and let the domain update library status.
- Screens reload on focus rather than using a new global invalidation store.
- Dynamic Reading route params are normalized before they reach screen components.

## Out of Scope

Advanced charts, yearly statistics, reading goals, wishlist, backup/Drive UI, notifications, timer/background reading, OCR/page scan, remote sync, social sharing, rich notes, TanStack Query and persisted Zustand were intentionally not added.
