# Localization

This step finalizes the first localization pass for the ISBN fallback, onboarding language choice, bootstrap copy, and Settings backup/Google Drive surfaces.

## Supported locales

The app currently supports:

- `en`
- `pt-BR`

The i18n runtime is based on the existing setup with:

- `i18next`
- `react-i18next`
- `expo-localization`

## Startup behavior

Locale selection is stored through the existing locale preference store.

At startup:

1. the localization provider loads the saved locale
2. the i18n instance switches language before the main app renders
3. `LocaleBootstrapGate` routes the user to `/welcome/language` when no locale is saved
4. once a locale exists, the language screen is skipped on later launches

This avoids relying only on the device locale and prevents the language prompt from reappearing after a saved choice.

## First access

The first-access language screen:

- shows the existing logo
- offers `English` and `Português (Brasil)`
- persists the choice
- applies the locale immediately
- redirects into tabs after success
- keeps accessibility labels localized

## Settings

Settings now supports in-app language switching through the existing localization provider.

Changing language in Settings:

- applies immediately
- persists the choice
- updates visible Settings copy without restarting
- does not reinitialize the database
- does not clear user data

## Formatting

Localized formatters are used for:

- date labels
- number labels
- backup count summaries
- backup file sizes

Persistence format remains `YYYY-MM-DD` for stored dates.

## Scope completed in this step

This step localized:

- onboarding language selection
- bootstrap loading and initialization errors
- Google Books ISBN fallback user copy already introduced in this step
- Settings language controls
- Settings backup copy
- Settings Google Drive copy
- Settings application info copy
- Settings error mapping

## Remaining caution

The wider app still contains older hardcoded strings from previous feature steps outside the ISBN fallback and Settings surfaces. Those strings were not all rewritten in this pass.

## Reading, Statistics and PT-BR completion

This pass extended localization coverage to the core Reading and Statistics experience and to some supporting Library and Lists surfaces that still leaked English.

### Completed in this pass

- Reading screen, history, start, log, and cycle flows
- Reading validation messages
- Reading public error mapping
- Statistics overview, periods, sorting labels, charts, and formatters
- App error/modal fallbacks
- Library shared formatters and several Library support components
- Lists add-item and list-details support flows used around Reading/Statistics

### Runtime guarantees

- stored civil dates remain `YYYY-MM-DD`
- localized formatting now prefers the active locale for dates and numbers
- Reading errors no longer intentionally expose raw database-ish internals in the localized path
- key parity between `en` and `pt-BR` remains enforced by the localization test suite

### Remaining untranslated areas

Some user-facing English still remains outside the core closure of this step, notably in:

- `src/presentation/library/add/google-books-results-list.tsx`
- `src/presentation/lists/wishlist-item-screen.tsx`
- `src/presentation/goals/add-goal-books-screen.tsx`
- `src/presentation/goals/goal-details-screen.tsx`
- `src/presentation/goals/goal-form-screen.tsx`
- `src/presentation/library/details/library-book-header.tsx`
