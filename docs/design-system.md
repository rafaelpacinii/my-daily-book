# My Daily Book Design System

This document describes the frontend foundation used by the Expo app. It covers visual tokens, base components, shell navigation, and initialization states only. Business workflows such as book search, adding books, reading logs, charts, OAuth controls, and backup management are intentionally outside this step.

## Brand Palette

Logo path: `assets/images/logo.png`

- Deep green `#244A3A`: primary actions, active navigation, strong brand surfaces.
- Sage green `#8FAF9D`: secondary surfaces, soft highlights, supporting accents.
- Cream `#F5F0E6`: light-mode app background.
- Soft terracotta `#C97B63`: attention, badges, progress accents, selected details.
- Graphite `#2D312F`: primary readable text in light mode.

The palette is exposed through semantic theme colors in `src/theme/colors.ts`, then assembled into light and dark themes in `src/theme/themes.ts`.

## Tokens

Theme tokens are exported from `src/theme`:

- `colors`: semantic light and dark color roles.
- `spacing`: consistent layout gaps and paddings.
- `radii`: rounded corners for buttons, cards, controls, and full pills.
- `typography`: text variants, font sizes, weights, and line heights.
- `shadows`: platform-aware elevation presets.
- `iconSizes` and `componentHeights`: stable sizing for controls and navigation.

Use `useAppTheme()` from `src/presentation` instead of hardcoding token values inside UI components or screens.

Spacing is intentionally compact: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, and `xxxl`. Radius tokens are `sm`, `md`, `lg`, `xl`, and `full`.

## Light Theme

The light theme uses cream as the app background, white surfaces, deep green as the primary action color, sage as the soft primary surface, terracotta as the accent, and graphite for primary text.

## Dark Theme

The dark theme is not a direct inversion. It uses a very dark green background, slightly lighter green surfaces, sage as the primary action color, cream for primary text, terracotta for accents, and moderated success, warning, and error tones for contrast.

## Typography

The app uses system fonts in these variants:

- `display`
- `heading1`
- `heading2`
- `heading3`
- `body`
- `bodySmall`
- `label`
- `caption`
- `button`

The tone should feel clean and editorial. Decorative serif fonts are intentionally not used in the app UI.

## Components

Reusable components live under `src/components`:

- `brand/AppLogo`: app logo wrapper backed by `assets/images/logo.png`.
- `layout/Screen`: safe-area page container with loading, error, empty, and normal states.
- `navigation/AppHeader`: standard page header with optional logo and actions.
- `ui/AppText`: typography primitive for all visible text.
- `ui/Button` and `ui/IconButton`: action primitives with variants and disabled/loading states.
- `ui/Card`, `Divider`, `Badge`, `ProgressBar`: basic presentation primitives.
- `feedback/LoadingState`, `ErrorState`, `EmptyState`: reusable state blocks.
- `layout/SectionHeader`: compact section labels for shell screens.

Components should depend on theme tokens and public presentation hooks only. They must not import Drizzle tables, repositories, SecureStore, infrastructure clients, or other backend implementation details.

Short example:

```tsx
<Card variant="outlined">
  <SectionHeader title="Currently reading" />
  <EmptyState
    icon="book-outline"
    title="No book currently being read"
    description="When you start a reading cycle, it will appear here."
  />
</Card>
```

Button variants are `primary`, `secondary`, `outline`, `ghost`, and `danger`. Card variants are `default`, `outlined`, `elevated`, and `interactive`. Badge variants are `to_read`, `reading`, `read`, `dropped`, `active`, `completed`, and `cancelled`.

## Navigation

The root layout uses Expo Router and wraps the app with:

- `AppThemeProvider`
- `ApplicationProvider`
- `ApplicationBootstrapGate`
- React Navigation theme provider

The tab shell contains five routes:

- Home
- Library
- Reading
- Lists
- Settings

Tabs use domain icons from `src/components/navigation/domain-icons.ts`. The app logo is used in the bootstrap screen and home/header areas, not in the tab bar.

## Logo

`AppLogo` loads `assets/images/logo.png` with `resizeMode="contain"` and `accessibilityLabel="My Daily Book"`. The component supports a configurable square size and a simple text fallback if the image fails to load. The logo file is not edited or converted into an app icon in this foundation step.

## Initialization

`ApplicationProvider` is the only frontend entry point into the backend bootstrap. It calls `initializeApplication` from `src/application` and exposes the public `ApplicationApi` through `useApplication()`.

`ApplicationBootstrapGate` renders:

- a logo loading state while the local application API initializes;
- a visual retry error state when initialization fails;
- app navigation once the API is ready.

Initialization errors are converted to user-safe messages by `mapApplicationErrorToMessage`.

## Accessibility

- Interactive controls use `accessibilityRole="button"` where appropriate.
- Disabled and loading button states expose `accessibilityState`.
- `ProgressBar` exposes `accessibilityRole="progressbar"` and numeric accessibility values.
- The logo is exposed as an accessible image.
- Status-like components use text labels, not color alone.
- Minimum touch target sizes come from `componentHeights`.

## Validation

Run these checks after frontend foundation changes:

```bash
npx tsc --noEmit --pretty false
npm run lint
npm test
npx expo install --check
```

## Current Boundaries

The current UI is intentionally a foundation shell. Buttons, empty states, filters, and modal placeholders exist for visual structure, but they do not execute business flows yet. Future feature screens should consume only the public application API and public domain/application types.
