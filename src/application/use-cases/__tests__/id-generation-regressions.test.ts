import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = process.cwd();

describe('ID generation regressions', () => {
  it('keeps the Expo UUID fallback centralized in the use-case dependency resolver', () => {
    const sharedFile = readProjectFile('src/application/use-cases/shared.ts');

    assert.match(sharedFile, /expoCryptoIdGenerator/);
    assert.match(sharedFile, /idGenerator:\s+dependencies\.idGenerator \?\? expoCryptoIdGenerator/);
    assert.match(sharedFile, /if \(!isDatabaseError\(error\)\) \{\s+throw error;\s+\}/);
  });

  it('keeps Expo-compatible UUID generation isolated from the domain layer', () => {
    const idsDomainFile = readProjectFile('src/domain/shared/ids.ts');
    const idsInfrastructureFile = readProjectFile('src/infrastructure/ids/expo-id-generator.ts');

    assert.doesNotMatch(idsDomainFile, /expo-crypto/);
    assert.doesNotMatch(idsDomainFile, /crypto\.randomUUID/);
    assert.match(idsInfrastructureFile, /from 'expo-crypto'/);
    assert.match(idsInfrastructureFile, /createIdGenerator\(Crypto\.randomUUID\)/);
  });

  it('keeps critical creation flows on the injected idGenerator', () => {
    assertUsesInjectedIdGenerator('src/application/use-cases/lists/book-list-use-cases.ts');
    assertUsesInjectedIdGenerator('src/application/use-cases/library/add-book-to-library.ts');
    assertUsesInjectedIdGenerator('src/application/use-cases/goals/reading-goal-use-cases.ts');
    assertUsesInjectedIdGenerator('src/application/use-cases/wishlist/wishlist-use-cases.ts');
    assertUsesInjectedIdGenerator('src/application/use-cases/reading/start-reading-cycle.ts');
    assertUsesInjectedIdGenerator('src/application/use-cases/reading/reading-log-use-cases.ts');
    assertUsesInjectedIdGenerator('src/application/use-cases/links/purchase-link-use-cases.ts');
  });
});

function assertUsesInjectedIdGenerator(relativePath: string): void {
  const file = readProjectFile(relativePath);

  assert.match(
    file,
    /resolveUseCaseDependencies\(dependencies\)/,
    `${relativePath} should resolve injected dependencies.`,
  );
  assert.match(
    file,
    /idGenerator\.generate\(\)/,
    `${relativePath} should generate IDs through the injected generator abstraction.`,
  );
}

function readProjectFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}
