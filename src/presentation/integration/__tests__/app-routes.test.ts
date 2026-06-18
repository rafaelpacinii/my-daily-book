import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const appRoot = join(process.cwd(), 'app');

const criticalRouteFiles = [
  '(tabs)/index.tsx',
  '(tabs)/library.tsx',
  '(tabs)/reading.tsx',
  '(tabs)/lists.tsx',
  '(tabs)/settings.tsx',
  'library/add.tsx',
  'library/manual.tsx',
  'library/search.tsx',
  'library/google-books/[volumeId].tsx',
  'library/[libraryBookId].tsx',
  'reading/start.tsx',
  'reading/cycle/[readingCycleId].tsx',
  'reading/cycle/[readingCycleId]/log.tsx',
  'reading/log/[readingLogId]/edit.tsx',
  'reading/history.tsx',
  'reading/history/[readingCycleId].tsx',
  'lists/create.tsx',
  'lists/[bookListId].tsx',
  'lists/[bookListId]/add-book.tsx',
  'lists/[bookListId]/edit.tsx',
  'wishlist/index.tsx',
  'wishlist/add.tsx',
  'wishlist/item/[bookListItemId].tsx',
  'goals/index.tsx',
  'goals/create.tsx',
  'goals/[readingGoalId].tsx',
  'goals/[readingGoalId]/add-books.tsx',
  'goals/[readingGoalId]/edit.tsx',
  'statistics.tsx',
  'error.tsx',
] as const;

describe('critical app routes', () => {
  it('keeps the integrated reading, lists, wishlist, goals, statistics, and error routes mounted', () => {
    const missingRoutes = criticalRouteFiles.filter(
      (routeFile) => !existsSync(join(appRoot, routeFile)),
    );

    assert.deepEqual(missingRoutes, []);
  });
});
