status
completed with explicit limitations

o que ja estava pronto
- BrasilAPI client, parser, mapper, service, and baseline tests already existed
- Google Books ISBN fallback use case already preferred Google Books and only called BrasilAPI when ISBN search returned zero items
- edition schema already had `metadata_source`, `external_metadata_id`, and nullable `google_books_id`
- locale provider, locale gate, and initial language screen scaffold already existed

o que foi concluido agora
- removed broad casts from ISBN fallback tests and aligned dependency contracts to the actual use case needs
- added BrasilAPI abort coverage and backup validation coverage for invalid `googleBooksId` on non-Google metadata
- aligned `model.dbdiagram` with the migrated edition schema
- localized bootstrap error/loading copy, first-access language copy, and Settings backup/Drive/application copy
- localized Settings formatter and mapper outputs, including pluralized backup summaries and locale-aware timestamps
- updated Expo dependency compatibility by changing `expo-localization` to the SDK 54-compatible version

migration
- existing migration reused: `src/database/migrations/0001_charming_amphibian.sql`
- no equivalent duplicate migration created

arquivos principais
- `src/application/use-cases/google-books/search-google-books.ts`
- `src/application/use-cases/google-books/__tests__/isbn-fallback.test.ts`
- `src/infrastructure/brasil-api/*`
- `src/database/schema/editions.ts`
- `src/domain/backup/__tests__/backup-validation.test.ts`
- `src/presentation/settings/*`
- `src/presentation/errors/map-application-error-to-message.ts`
- `src/bootstrap/ApplicationBootstrapGate.tsx`
- `app/welcome/language.tsx`
- `src/localization/locales/en.ts`
- `src/localization/locales/pt-BR.ts`
- `model.dbdiagram`

comandos e resultados
- `git status --short`: worktree already had broad prior changes; this step continued inside that existing state
- `git diff --stat`: existing large diff already in progress before this continuation
- `npx tsc --noEmit --pretty false`: passed
- `npm run lint`: passed
- `npm test`: passed
- `npx expo install --check`: passed after aligning `expo-localization`
- `npx expo-doctor`: passed after aligning `expo-localization`

limitacoes
- no route-level automated test harness was added for the `/welcome/language` redirect flow
- the wider app still has older hardcoded visible strings outside the onboarding/bootstrap/Settings/ISBN-fallback surfaces finished here

proximo ponto exato
- continue the broader full-app localization audit starting from remaining hardcoded strings in Home, Reading, Lists, Library filters/forms, and related presentation formatters
