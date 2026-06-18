# Android preview validation

Status on June 16, 2026:

- EAS authentication: blocked
- EAS project linking: blocked
- Preview build execution: blocked before upload
- Device validation: pending build artifact

## Source of truth reviewed

- `AGENTS.md`
- `docs/production-build.md`
- `docs/branding.md`
- `docs/codex-progress/production-branding-and-eas.md`
- `app.json`
- `eas.json`
- `package.json`
- `.env.example`

Expo SDK 54 docs were checked before this stage:

- `https://docs.expo.dev/versions/v54.0.0/config/app/`
- `https://docs.expo.dev/versions/v54.0.0/guides/adaptive-icons/`
- `https://docs.expo.dev/versions/v54.0.0/versions/latest/sdk/splash-screen/`
- `https://docs.expo.dev/eas/json/`

## Android preview target

- app name: `My Daily Book`
- Expo slug: `my-daily-book`
- profile: `preview`
- distribution: `internal`
- Android build type: `apk`
- Android package: `com.rafaelpacini.mydailybook`
- scheme: `mydailybook`
- OAuth redirect path: `oauth`

The current Expo config does not define `extra.eas.projectId`.

## EAS status

Commands executed:

```bash
npx eas-cli whoami
npx eas-cli project:info
```

Results:

- `npx eas-cli whoami`: `Not logged in`
- `npx eas-cli project:info`: failed because an Expo user account is required before the command can proceed

Because authentication is missing, this stage did not attempt project linking, credential generation, or cloud upload.

Required next command:

```bash
npx eas-cli login
```

Before any build execution, confirm and present:

- Expo account or organization
- target project slug
- Android package `com.rafaelpacini.mydailybook`
- profile `preview`

## Environment variables

Locally confirmed variable names:

- `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_BOOKS_API_URL`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Local config behavior:

- `expo config --type public` loaded only `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` and `EXPO_PUBLIC_GOOGLE_BOOKS_API_URL` from `.env.development.local`
- `.env.example` includes placeholders for the Android, iOS, and web Google OAuth client IDs
- no real values were written to `app.json`, `eas.json`, docs, or Git-tracked configuration

EAS environment status:

- not validated because the Expo account is not authenticated
- no EAS environment variable values were printed

Safe follow-up commands after authentication:

```bash
npx eas-cli env:list --environment preview
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value <redacted>
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY --value <redacted>
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_GOOGLE_BOOKS_API_URL --value https://www.googleapis.com/books/v1
```

## OAuth Android status

Confirmed in project code and config:

- package: `com.rafaelpacini.mydailybook`
- scheme: `mydailybook`
- redirect path: `oauth`
- redirect URI is built with `AuthSession.makeRedirectUri({ scheme: 'mydailybook', path: 'oauth' })`

Pending external validation:

- Android Google Cloud client ID must match the final package
- SHA-1 must come from official EAS credential output or an existing legitimate keystore
- no SHA-1 was available in this environment
- no client secret is used or required in the app code

## Credentials

Credential state is unknown because no authenticated EAS session is available.

Decision recorded for the next authenticated run:

- prefer EAS-managed Android credentials
- do not store keystore material in the repository
- do not replace existing credentials without explicit confirmation

## Local validation results

Commands executed:

```bash
npm run assets:check
npx tsc --noEmit --pretty false
npm run lint
npm test
npx expo install --check
npx expo config --type public
```

Results:

- `npm run assets:check`: passed
- `npx tsc --noEmit --pretty false`: passed
- `npm run lint`: passed
- `npm test`: passed, `47` tests, `47` pass, `0` fail
- `npx expo install --check`: passed in offline mode, dependencies reported up to date
- `npx expo config --type public`: passed and confirmed public config only

`npx expo-doctor` was executed multiple times, but it did not return a stable result in this restricted environment. This item must be rerun in the authenticated follow-up session and recorded with its final exit status.

## Functional coverage available without device build

Automated coverage currently exists for:

- Google Books lookup flow
- ISBN fallback to BrasilAPI
- backup validation and serialization
- Google Drive client upload/list/download/delete behavior
- localization resources
- reading, lists, wishlist, goals, and statistics domain/application behavior
- integrated route surface

Native-device-only items still pending:

- clean Android install
- splash and adaptive icon inspection
- real SQLite persistence on installed APK
- OAuth login and cancel flow
- Google Drive backup lifecycle on device
- update-over-install persistence

## Build status

No Android preview build was started.

Blocked reason classification:

- `authentication`
- `project linking`
- `external service`

No build ID or build URL exists yet.

## Next exact step

1. Run `npx eas-cli login`.
2. Confirm the Expo account or organization and intended EAS project destination.
3. Link or create the EAS project through the official authenticated flow without inventing `extra.eas.projectId`.
4. Verify preview environment variables in EAS without printing values.
5. Execute `npx eas-cli build --platform android --profile preview`.
6. Install the generated APK on a real Android device and complete the manual checklist.
