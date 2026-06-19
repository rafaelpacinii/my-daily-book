# Android functional validation

Status: partially completed with Android runtime blocked

Date: 2026-06-18 22:56:31 -03

## Environment

- Project: Expo React Native `my-daily-book`
- Expo SDK reference checked before code changes: `https://docs.expo.dev/versions/v54.0.0/`
- Node: `v22.22.2`
- Expo CLI reported by `npx expo --version`: `54.0.25`
- Android runtime: not available in this workspace
- `adb`: not installed (`adb: command not found`)
- EAS/OAuth real-device Google Drive validation: not executed in this environment

## Initial Status

- `git status --short`: clean before changes
- `git diff --stat`: no diff before changes
- Existing automated checks passed before fixes except `npm run lint`, which initially needed permission to create Expo cache/config under `/home/rafael/.expo`
- `npx expo start --clear` could not complete because the Expo CLI/freeport path attempted to listen on invalid port `65536` under Node `v22.22.2`

## Checklist Executed

- Read required source-of-truth files:
  - `AGENTS.md`
  - `docs/codex-progress/manual-book-entry-and-editable-library-import.md`
  - `docs/codex-progress/reading-statistics-ptbr.md`
  - `docs/codex-progress/critical-bug-fix-sprint.md`
  - `docs/codex-progress/production-branding-and-eas.md`
  - `docs/android-preview-validation.md`
  - `app.json`
  - `eas.json`
  - `package.json`
- Ran initial validation commands.
- Audited requested technical patterns.
- Audited known localization surfaces.
- Applied regression fixes only for visible app strings, accessibility labels, and Home locale formatting.
- Ran final validation commands.

## Scenarios Approved

Automated validation passed for:

- Branding asset presence and PNG constraints.
- TypeScript compile.
- Expo lint.
- Unit/integration tests for application bootstrap, localization, Google Books, BrasilAPI fallback, backup, Google Drive client behavior, reading, lists, wishlist, goals, statistics, navigation routes, and theme.
- Expo dependency check using the local dependency map in offline mode.
- Expo Doctor after network/cache access was allowed.
- Public Expo config output.

Manual Android scenarios were not approved because no Android runtime was available.

## Bugs Found

### 1. pt-BR and accessibility regressions in visible screens

Affected surfaces:

- Home overview components
- Wishlist item details
- Goal create/edit/add-books/details
- Library book details, copies, and header

Root cause:

- Several screens still rendered English literals directly instead of using i18n keys.
- Home formatters used hardcoded English month, weekday, and greeting strings.

Corrections:

- Added matching `en` and `pt-BR` translation keys.
- Replaced visible strings and accessibility labels with `useTranslation()`.
- Localized Home greeting/date/duration display where rendered.
- Added a regression assertion for pt-BR Home greeting and civil-date formatting.

Tests added or updated:

- `src/presentation/home/__tests__/home-formatters.test.ts`

## Technical Audit Results

- `crypto.randomUUID`, `globalThis.crypto`, and `window.crypto`: no production regressions found; only existing test coverage references `globalThis.crypto`.
- `returning()`: no new changes made.
- `as any`, `@ts-ignore`, `@ts-nocheck`: no targeted production regressions found in the changed files.
- `console.log` / `console.error`:
  - Scripts intentionally log command results.
  - Runtime logs found in database/bootstrap are guarded by `__DEV__`.
- Loading states in the changed screens already use completion paths or retry/error states.
- Temporary picker URI persistence was not changed in this pass.

## Commands And Results

- `git status --short`: clean at start; changed files after fixes are expected.
- `git diff --stat`: no diff at start.
- `npm run assets:check`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm test`: passed, `52/52`.
- `npx expo install --check`: passed in offline mode using `expo/bundledNativeModules.json`; Expo warned that offline dependency validation is unreliable.
- `npx expo-doctor`: passed, `18/18`.
- `npx expo config --type public`: passed.
- `adb devices -l`: blocked, `adb: command not found`.
- `npx expo start --clear`: blocked by `RangeError [ERR_SOCKET_BAD_PORT]`, invalid port `65536`.
- `npx expo start --clear --offline --port 8081`: same invalid port `65536` failure.

## External Blockers

- No `adb` binary or Android device/emulator is available in this workspace.
- Only Node 22 is available (`/usr/bin/node -> node-22`); no Node 20 runtime is installed for comparison.
- Metro startup is blocked before Android validation by the Expo CLI/freeport invalid port failure under this environment.
- Google Drive OAuth cannot be considered validated without a real Android runtime and configured OAuth credentials.

## Next Exact Point

Run the Android functional checklist on a machine with:

- Node 20.19.x or another Expo SDK 54-compatible Node runtime known to avoid the current freeport failure.
- Android SDK platform tools with `adb`.
- A connected Android device or running emulator.
- A development or preview build with Google OAuth values configured.

