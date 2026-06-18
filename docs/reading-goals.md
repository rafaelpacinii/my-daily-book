# Reading Goals

Reading Goals let the app track a named set of library books against a civil start date and target date.

## Scope

- `/goals` lists active, completed and cancelled goals.
- `/goals/create` creates a goal with optional description, civil dates and local library books.
- `/goals/[readingGoalId]` shows progress, timing, items and cancellation/removal actions.
- `/goals/[readingGoalId]/edit` edits name, description, start date and target date.
- `/goals/[readingGoalId]/add-books` adds more local library books.

Goals are not a tab. They are linked from Home, Reading and Lists.

## Domain Behavior

The frontend does not set progress or completion status directly. It calls the public `GoalsApi` and renders the returned read model.

An item is completed when the application layer finds a completed reading cycle for that book inside the goal date range. When a reading cycle is completed, related goals are recalculated in the same use-case flow as the library book status update.

Cancelled goals keep their items and historical progress, but no longer appear as active.

## Dates And Timing

Civil dates stay in `YYYY-MM-DD` format in forms and API input. UI formatting parses date parts directly instead of using `new Date('YYYY-MM-DD')`.

The UI renders:

- `Due today`
- `Due in N days`
- `Overdue by N days`
- `Completed on time`
- `Completed after deadline`
- `Cancelled`

## Current Constraints

- Goals are book-count goals only.
- No page, time, yearly, notification, sharing or gamification goals are included.
- Adding multiple books after creation calls the current public API sequentially because `GoalsApi.addBook` accepts one book per mutation.
- Goal item detail uses the public goal read model, which does not currently expose cover images. Selection screens use `LibraryApi.listBooks`, which does expose covers.

