# Statistics

Statistics provides a dedicated `/statistics` route for reading totals, streaks, period charts and grouped reading insights.

## Access

Statistics is not a tab. It is linked from:

- Home quick actions.
- Reading.
- Direct route `/statistics`.

## Periods

The screen supports:

- 7 days
- 30 days
- This month
- This year
- All time
- Custom

Custom periods use `YYYY-MM-DD` civil dates and validate `endDate >= startDate`.

## Metrics

The overview shows:

- Total pages read
- Total reading time
- Reading days
- Completed books
- Completed cycles
- Rereads
- Average pages per reading day
- Average pages per log
- Current streak
- Longest streak

Empty databases render zero values with an orienting empty state instead of an error.

## Charts

Charts are lightweight React Native bar charts built with existing `View` and theme tokens. No chart dependency is installed.

The charts show:

- Pages by day
- Reading time by day
- Pages by month

Daily and monthly buckets come from the public statistics API. The API fills gaps with zero buckets for the selected date range so charts keep temporal continuity.

## Grouped Statistics

The screen includes sections for:

- Books, sortable by pages, time, completed cycles and title.
- Authors, using the application query attribution rules.
- Formats: physical, digital and unknown.

Reading without a copy stays in the `unknown` format bucket.

## Boundaries

Statistics does not add goals, gamification, badges, social ranking, report export, PDF, notifications, backend sync, TanStack Query or Zustand.

