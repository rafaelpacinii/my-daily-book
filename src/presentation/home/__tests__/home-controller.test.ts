import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  ApplicationApi,
  DailyReadingSummary,
  LibraryBookSummary,
  LibraryOverview,
  ReadingGoalDetails,
  ReadingStreak,
} from '@/src/application';
import { loadHomeViewModel } from '@/src/presentation/home/home-controller';

describe('home controller', () => {
  it('loads all Home queries into a view model', async () => {
    const api = createApi();
    const viewModel = await loadHomeViewModel({
      api,
      getToday: () => '2026-06-14',
    });

    assert.equal(viewModel.libraryOverview.total, 0);
    assert.equal(viewModel.todaySummary.readingDate, '2026-06-14');
    assert.equal(viewModel.streak.current, 0);
    assert.deepEqual(calls, [
      'getOverview',
      'listCurrentlyReadingBooks',
      'getDailySummary:2026-06-14',
      'getReadingStreak:2026-06-14',
      'getActiveGoals',
    ]);
  });

  it('propagates loading errors for the screen error state', async () => {
    const error = new Error('failed');
    const api = createApi({
      library: {
        getOverview: () => {
          throw error;
        },
      },
    });

    await assert.rejects(
      () => loadHomeViewModel({ api, getToday: () => '2026-06-14' }),
      error,
    );
  });

  it('starts independent Home queries before awaiting their results', async () => {
    const overviewDeferred = deferred<LibraryOverview>();
    const readingDeferred = deferred<LibraryBookSummary[]>();
    const dailyDeferred = deferred<DailyReadingSummary>();
    const streakDeferred = deferred<ReadingStreak>();
    const goalsDeferred = deferred<ReadingGoalDetails[]>();
    const api = createApi({
      library: {
        getOverview: () => {
          calls.push('getOverview');
          return overviewDeferred.promise as unknown as LibraryOverview;
        },
        listCurrentlyReadingBooks: () => {
          calls.push('listCurrentlyReadingBooks');
          return readingDeferred.promise as unknown as LibraryBookSummary[];
        },
      },
      reading: {
        getDailySummary: (date: string) => {
          calls.push(`getDailySummary:${date}`);
          return dailyDeferred.promise as unknown as DailyReadingSummary;
        },
      },
      statistics: {
        getReadingStreak: (date?: string) => {
          calls.push(`getReadingStreak:${date}`);
          return streakDeferred.promise as unknown as ReadingStreak;
        },
      },
      goals: {
        getActiveGoals: () => {
          calls.push('getActiveGoals');
          return goalsDeferred.promise as unknown as ReadingGoalDetails[];
        },
      },
    });

    const loading = loadHomeViewModel({ api, getToday: () => '2026-06-14' });

    assert.deepEqual(calls, [
      'getOverview',
      'listCurrentlyReadingBooks',
      'getDailySummary:2026-06-14',
      'getReadingStreak:2026-06-14',
      'getActiveGoals',
    ]);

    overviewDeferred.resolve(emptyOverview());
    readingDeferred.resolve([]);
    dailyDeferred.resolve(emptyDailySummary('2026-06-14'));
    streakDeferred.resolve(emptyStreak());
    goalsDeferred.resolve([]);

    const viewModel = await loading;
    assert.equal(viewModel.libraryOverview.total, 0);
  });
});

interface ApiOverrides {
  library?: Partial<ApplicationApi['library']>;
  reading?: Partial<ApplicationApi['reading']>;
  statistics?: Partial<ApplicationApi['statistics']>;
  goals?: Partial<ApplicationApi['goals']>;
}

let calls: string[] = [];

function createApi(overrides: ApiOverrides = {}): ApplicationApi {
  calls = [];

  const api = {
    library: {
      getOverview: () => {
        calls.push('getOverview');
        return emptyOverview();
      },
      listCurrentlyReadingBooks: () => {
        calls.push('listCurrentlyReadingBooks');
        return [];
      },
    },
    reading: {
      getDailySummary: (date: string) => {
        calls.push(`getDailySummary:${date}`);
        return emptyDailySummary(date);
      },
    },
    statistics: {
      getReadingStreak: (date?: string) => {
        calls.push(`getReadingStreak:${date}`);
        return emptyStreak();
      },
    },
    goals: {
      getActiveGoals: () => {
        calls.push('getActiveGoals');
        return [];
      },
    },
  } as unknown as ApplicationApi;

  return {
    ...api,
    ...overrides,
    library: {
      ...api.library,
      ...overrides.library,
    },
    reading: {
      ...api.reading,
      ...overrides.reading,
    },
    statistics: {
      ...api.statistics,
      ...overrides.statistics,
    },
    goals: {
      ...api.goals,
      ...overrides.goals,
    },
  } as ApplicationApi;
}

function emptyOverview(): LibraryOverview {
  return {
    total: 0,
    toRead: 0,
    reading: 0,
    read: 0,
    dropped: 0,
    owned: 0,
    notOwned: 0,
    physicalCopies: 0,
    digitalCopies: 0,
  };
}

function emptyDailySummary(date: string): DailyReadingSummary {
  return {
    readingDate: date,
    pagesRead: 0,
    durationSeconds: 0,
    logCount: 0,
    booksRead: 0,
    logs: [],
  };
}

function emptyStreak(): ReadingStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    latestReadingDate: null,
  };
}

function deferred<T>() {
  let resolveValue: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolveValue = resolve;
  });

  return {
    promise,
    resolve: resolveValue,
  };
}
