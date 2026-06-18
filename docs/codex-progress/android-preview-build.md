status
blocked by missing EAS authentication before project linking and preview build

arquivos alterados
- `docs/android-preview-validation.md`
- `docs/codex-progress/android-preview-build.md`

contexto confirmado
- profile `preview` remains `distribution: internal`
- `preview.android.buildType` remains `apk`
- Android package `com.rafaelpacini.mydailybook`
- scheme `mydailybook`
- OAuth redirect path `oauth`
- `extra.eas.projectId` is absent from the current Expo config

comandos executados
- `git status --short`
- `git diff --stat`
- `npx eas-cli whoami`
- `npx eas-cli project:info`
- `npx expo config --type public`
- `npx expo-doctor`
- `npx expo install --check`
- `npm run assets:check`
- `npx tsc --noEmit --pretty false`
- `npm run lint`
- `npm test`

resultados
- `npx eas-cli whoami`: `Not logged in`
- `npx eas-cli project:info`: failed because an Expo account is required before proceeding
- `npx expo config --type public`: passed
- `npx expo install --check`: passed in offline mode
- `npm run assets:check`: passed
- `npx tsc --noEmit --pretty false`: passed
- `npm run lint`: passed
- `npm test`: passed with `47` tests, `47` pass, `0` fail
- `npx expo-doctor`: attempted repeatedly but did not produce a stable final result in this restricted environment

variaveis confirmadas sem valores
- `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_BOOKS_API_URL`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

oauth android
- package, scheme, and redirect path are aligned in code and config
- Android Google Cloud client ID still needs external validation against the final package and a real SHA-1
- no SHA-1 was available legitimately in this environment

credenciais
- none inspected or generated
- next authenticated run should prefer EAS-managed Android credentials

build executado ou bloqueado
- preview build blocked before upload
- no build ID
- no build URL

cenarios testados
- local public Expo config validation
- branding asset validation
- TypeScript, lint, and automated tests
- code-level validation of migrations, SQLite initialization, Google Drive auth redirect, Google Books fallback, backup flows, localization, goals, wishlist, and statistics

bloqueios externos
- Expo account not authenticated
- EAS project destination not yet discoverable
- EAS environment variables not verifiable without authentication
- no APK available, so no Android device validation could begin

proximo passo
- run `npx eas-cli login`, confirm the destination Expo account or organization and project slug, verify preview environment variables in EAS, then run `npx eas-cli build --platform android --profile preview`
