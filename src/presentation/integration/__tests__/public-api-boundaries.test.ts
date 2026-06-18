import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const presentationRoot = join(process.cwd(), 'src/presentation');
const forbiddenImports = [
  '@/src/database',
  '@/src/domain',
  '@/src/infrastructure',
  '@/src/application/use-cases',
  '@/src/application/queries',
] as const;

describe('presentation public API boundaries', () => {
  it('does not import implementation layers from production presentation files', () => {
    const violations = listSourceFiles(presentationRoot)
      .filter((filePath) => !filePath.includes('__tests__'))
      .flatMap((filePath) => {
        const source = readFileSync(filePath, 'utf8');
        return forbiddenImports
          .filter((forbiddenImport) => source.includes(forbiddenImport))
          .map((forbiddenImport) => `${filePath.replace(`${process.cwd()}/`, '')}: ${forbiddenImport}`);
      });

    assert.deepEqual(violations, []);
  });
});

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      return listSourceFiles(filePath);
    }

    return filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? [filePath] : [];
  });
}
