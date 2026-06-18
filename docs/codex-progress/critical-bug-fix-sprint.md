status
completed with Android-runtime limitations

focus
- fix UUID generation failures caused by `crypto.randomUUID()` in Expo native runtime
- stop reclassifying runtime ID failures as `DatabaseError`

crypto search findings
- `src/domain/shared/ids.ts` was the only production source file using `crypto.randomUUID()`
- no direct `globalThis.crypto` or `window.crypto` usage found elsewhere in the audited app code

root cause
- the app had a centralized ID abstraction, but its default implementation depended on global Web Crypto instead of Expo's `expo-crypto`
- when native runtime lacked global `crypto`, creation flows failed during ID generation
- the shared transaction wrapper then mapped that runtime failure as a database error

central solution
- keep the contract in `src/domain/shared/ids.ts`
- move the Expo-specific UUID implementation to `src/infrastructure/ids/expo-id-generator.ts`
- resolve default IDs from `src/application/use-cases/shared.ts` with `expoCryptoIdGenerator`

error handling adjustment
- added `isDatabaseError()` in `src/database/repositories/shared.ts`
- `runUseCaseTransaction()` now rethrows non-database runtime failures instead of wrapping them as persistence failures

flows covered
- wishlist bootstrap
- create list
- add book to library
- create reading goal
- start reading cycle
- add reading log
- add purchase link
- mark wishlist item as purchased

tests added
- `src/domain/shared/__tests__/ids.test.ts`
- `src/database/repositories/__tests__/shared.test.ts`
- `src/application/use-cases/__tests__/id-generation-regressions.test.ts`

commands run
- `git status --short`
- `git diff --stat`
- `npx tsc --noEmit --pretty false`
- `npm run lint`
- `npm test`
- `npx expo install --check`
- `npx expo-doctor`
- `npx expo start --clear`

results
- TypeScript: pass
- lint: pass
- tests: pass with `51/51`
- Expo dependency check: pass in offline mode
- Expo Doctor: pass with `18/18`
- Expo start clear: startup reached project initialization output, then process was interrupted manually

limitations
- no Android device or emulator validation from this environment
- no preview build generation in this pass
