# Text Visibility Fix

## Root Cause

`AppText` always defaulted `color` to `textPrimary`. That made a nested `AppText` used only for emphasis stop inheriting the parent text color. When a parent used a contrasting semantic color such as `textInverse`, a child without an explicit color could fall back to `textPrimary`, which can be low contrast on primary/danger surfaces.

The known `LibraryEmptyState` label is rendered through `EmptyState -> Button -> AppText`. It is not manually split in `library-empty-state.tsx`, but the same base component behavior could affect any partially emphasized or nested text in the app.

## Files Affected

- `src/components/ui/AppText.tsx`
- `src/components/ui/app-text-style.ts`
- `src/components/ui/Button.tsx`
- `src/presentation/library/components/library-empty-state.tsx`
- `src/presentation/library/components/library-empty-state-content.ts`
- `src/components/ui/__tests__/app-text.test.ts`
- `src/presentation/library/__tests__/library-empty-state.test.ts`
- `src/theme/__tests__/theme.test.ts`

## Fix

- Added color inheritance to `AppText` through a local context.
- Added a pure style resolver so nested text without `color` inherits the parent resolved color.
- Preserved predictable override order: base text style, variant style, semantic color, then external `style`.
- Kept standalone `AppText` defaulting to `theme.colors.textPrimary`.
- Made button labels centered and shrinkable with vertical padding so wrapped labels such as `Add your first book` are less likely to clip on web/Android.
- Extracted `LibraryEmptyState` copy into a pure helper for direct tests.

## Other Areas Audited

- `src/theme/**`
- `src/components/ui/AppText.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/component-state.ts`
- `src/components/feedback/EmptyState.tsx`
- `src/components/ui/Card.tsx`
- `src/presentation/library/components/library-empty-state.tsx`
- Global searches for `transparent`, `opacity: 0`, `textPrimary`, `textSecondary`, disabled states, emphasis/highlight patterns and nested text.

Remaining opacity matches:

- `src/presentation/home/components/home-loading-state.tsx`: loading illustration opacity.
- `src/presentation/library/components/library-loading-state.tsx`: loading illustration opacity.
- `src/presentation/library/library-screen.tsx`: intentionally hidden accessibility/helper label.

## Tests

- `AppText` default light/dark color.
- Nested child text inherits parent color.
- Child external style can still override color predictably.
- No transparent fallback in `AppText` style tests.
- Theme text tokens exist in both themes and do not equal common backgrounds.
- `LibraryEmptyState` keeps full `Add your first book` label intact.

## Command Results

- `npx tsc --noEmit --pretty false`: passed, exit code `0`.
- `npm run lint`: passed, exit code `0`.
- `npm test`: passed, `34` tests, `34` pass, `0` fail.

## Visual Verification

Manual Android/web/theme visual verification was not run in this sandboxed session. The fix was verified through centralized style resolution tests and token audits. Expo SDK 54 docs were checked before code changes.

## Limitations

- The Node test runner cannot render React Native components directly without pulling untransformed React Native runtime files, so component assertions use pure helpers instead of rendered snapshots.
- The exact platform rendering of `Add your first book` should still be smoke-tested manually on web and Android with light/dark theme and larger font scale.
