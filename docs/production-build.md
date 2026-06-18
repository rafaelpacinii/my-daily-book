# Production build

This step prepares the Expo project for production branding and EAS build configuration without publishing to any store.

## Identifiers

Final configured identifiers:

- app name: `My Daily Book`
- slug: `my-daily-book`
- scheme: `mydailybook`
- Android package: `com.rafaelpacini.mydailybook`
- iOS bundle identifier: `com.rafaelpacini.mydailybook`

These differ from the earlier placeholder `com.mydailybook.app` values and should be reflected in future Google OAuth client registrations for preview and production builds.

## Expo config

The Expo config now includes:

- `backgroundColor: #F5F0E6`
- `primaryColor: #244A3A`
- `userInterfaceStyle: automatic`
- production icon and favicon paths
- adaptive icon foreground and monochrome assets
- splash plugin configuration using the production splash asset
- `ios.buildNumber: "1"`
- `android.versionCode: 1`
- `android.blockedPermissions` for legacy external storage permissions
- Android status bar and navigation bar brand colors

No OTA update or EAS Update channel configuration was added in this step.

## EAS profiles

`eas.json` defines:

### development

- internal distribution
- development client enabled
- Android build type `apk`
- intended for device testing of OAuth, Google Drive, and native Expo modules

Command:

```bash
npx eas-cli build --platform android --profile development
```

### preview

- internal distribution
- Android build type `apk`
- intended for QA/internal review

Command:

```bash
npx eas-cli build --platform android --profile preview
```

### production

- production store-oriented profile
- `autoIncrement: true`

Command:

```bash
npx eas-cli build --platform android --profile production
```

## Variables

Public bundle variables currently used:

- `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_BOOKS_API_URL`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Do not put these in `eas.json`. Configure them in EAS environments instead.

Never place these in the app bundle or repo:

- client secret
- service account
- private key
- fixed refresh token

## OAuth compatibility

The runtime Google Drive auth flow uses:

- scheme: `mydailybook`
- redirect path: `oauth`
- redirect URI pattern from `AuthSession.makeRedirectUri({ scheme: 'mydailybook', path: 'oauth' })`

Compatibility guidance:

- development build: use Android/iOS client IDs created for the development package/bundle identifiers and custom scheme redirect
- preview build: same runtime scheme, but client IDs must also allow the configured native package/bundle identifiers
- production build: use final store package/bundle identifiers and matching Google OAuth client IDs

Expo Go is not the production-equivalent runtime for this auth flow.

## Permissions

This step intentionally avoids broad storage access.

Android explicitly blocks:

- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`

The current app surface only needs modern Expo modules for:

- network
- document picking
- sharing
- secure token storage
- auth session redirects

## Versioning

Version values are now separated clearly:

- app version: `expo.version`
- Android build number: `android.versionCode`
- iOS build number: `ios.buildNumber`
- database schema version: from backup/application constants
- backup format version: from backup/application constants

Settings continues reading version/build information from Expo Constants instead of hardcoded strings.

## Commands run

Executed in this step:

```bash
npm run assets:check
npx tsc --noEmit --pretty false
npm run lint
npm test
npx expo install --check
npx expo-doctor
npx expo config --type public
npx eas-cli --version
npx eas-cli whoami
npx expo start --clear --offline
```

## External blockers

Observed EAS status:

- `npx eas-cli --version`: `eas-cli/20.2.0`
- `npx eas-cli whoami`: `Not logged in`

The non-interactive preview build command was not executed successfully here because outbound project upload to Expo’s external build service is blocked in this environment without explicit destination approval.

Build command to rerun in an authenticated environment:

```bash
npx eas-cli build --platform android --profile preview --non-interactive
```

## Store checklist

Before Play Store submission:

- verify final Android OAuth client ID matches `com.rafaelpacini.mydailybook`
- verify launcher icon in a real installed build
- verify adaptive icon crop on circular and squircle launchers
- verify preview APK opens Google Drive auth correctly
- confirm versionCode increment strategy

Before App Store submission:

- verify final iOS OAuth client ID matches `com.rafaelpacini.mydailybook`
- verify splash and icon in a device build
- verify buildNumber increment strategy
- verify Google Drive auth and redirect behavior on device
