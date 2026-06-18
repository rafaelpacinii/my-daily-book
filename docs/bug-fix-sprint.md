# ID generation bug fix sprint

Date: June 16, 2026

## Scope

This pass fixed the Expo runtime failure caused by UUID generation depending on `crypto.randomUUID()` instead of the Expo-supported `expo-crypto` API.

## Root cause

The project already had a centralized ID abstraction, but its default implementation lived in `src/domain/shared/ids.ts` and called `crypto.randomUUID()` directly.

That works in environments where the global Web Crypto object is available, but it is not a safe assumption in the Expo native runtime. When a creation flow tried to allocate a new ID, the app could throw `ReferenceError: crypto is not defined`.

The failure was then misclassified in `runUseCaseTransaction()` because non-domain errors were always passed through `mapDatabaseError()`, which made the UUID failure show up as a generic `DatabaseError`.

## Locations found using crypto

Search terms used:

- `crypto.randomUUID`
- `globalThis.crypto`
- `window.crypto`
- `randomUUID`
- `uuidv4`
- `generateId`
- `createId`

Findings before the fix:

- `src/domain/shared/ids.ts` used `crypto.randomUUID()`

No other production source file was using global crypto access directly.

## Fix applied

### Centralized Expo UUID implementation

The ID abstraction was split into the right ownership layers:

- `src/domain/shared/ids.ts` now stays pure and only exposes the `IdGenerator` contract plus `createIdGenerator()`
- `src/infrastructure/ids/expo-id-generator.ts` now owns the Expo-specific implementation with `expo-crypto`
- `src/application/use-cases/shared.ts` now resolves the default generator with `expoCryptoIdGenerator`

This keeps the Expo dependency centralized in one place and avoids spreading `expo-crypto` imports through use cases.

### Error boundary fix

`src/application/use-cases/shared.ts` now rethrows non-persistence errors as-is:

- `DomainError` still passes through untouched
- only real database/persistence failures are mapped through `mapDatabaseError()`

`src/database/repositories/shared.ts` now exports `isDatabaseError()` so the transaction boundary can distinguish:

- SQLite/database failures
- ordinary runtime failures such as `ReferenceError`

## Flows covered

The ID path was confirmed in the creation flows for:

- wishlist bootstrap
- create list
- add book to library
- create reading goal
- start reading cycle
- add reading log
- add purchase link
- mark wishlist item as purchased

Also audited for related entities created through these flows:

- `authors`
- `works`
- `editions`
- `library_books`
- `book_copies`
- `reading_cycles`
- `reading_logs`
- `book_lists`
- `book_list_items`
- `purchase_links`
- `reading_goals`
- `reading_goal_items`

## Tests added

- `src/domain/shared/__tests__/ids.test.ts`
  - synchronous ID allocation through the abstraction
  - no dependence on global `crypto`
- `src/database/repositories/__tests__/shared.test.ts`
  - classifies SQLite errors as database errors
  - keeps `ReferenceError` outside database mapping
- `src/application/use-cases/__tests__/id-generation-regressions.test.ts`
  - verifies the resolver uses the centralized Expo generator
  - verifies critical creation flow files still allocate IDs through `idGenerator.generate()`
  - verifies the use-case boundary rethrows non-database runtime failures

## Validation commands

```bash
git status --short
git diff --stat
npx tsc --noEmit --pretty false
npm run lint
npm test
npx expo install --check
npx expo-doctor
npx expo start --clear
```

## Results

- `npx tsc --noEmit --pretty false`: passed
- `npm run lint`: passed
- `npm test`: passed with `51` tests, `51` pass, `0` fail
- `npx expo install --check`: passed in offline mode; dependencies reported up to date
- `npx expo-doctor`: passed, `18/18` checks
- `npx expo start --clear`: project startup reached `Starting project at /home/rpacini/Dev/personal-projects/my-daily-book`; process was then interrupted manually because this environment cannot keep an interactive Metro session attached

## Limitations

- no Android emulator or physical Android device was available in this environment
- no native preview build was generated in this pass
- `expo start --clear` was only validated up to startup output, not through an interactive device session
