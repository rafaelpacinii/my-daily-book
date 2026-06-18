export const appRoutes = {
  home: '/(tabs)',
  library: '/(tabs)/library',
  libraryAdd: '/library/add',
  libraryManual: '/library/manual',
  librarySearch: '/library/search',
  reading: '/(tabs)/reading',
  readingStart: '/reading/start',
  readingHistory: '/reading/history',
  lists: '/(tabs)/lists',
  listsCreate: '/lists/create',
  wishlist: '/wishlist',
  wishlistAdd: '/wishlist/add',
  goals: '/goals',
  goalsCreate: '/goals/create',
  statistics: '/statistics',
  settings: '/(tabs)/settings',
} as const;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];

export function libraryBookRoute(libraryBookId: string): `/library/${string}` {
  return `/library/${libraryBookId}`;
}

export function googleBookRoute(volumeId: string): `/library/google-books/${string}` {
  return `/library/google-books/${volumeId}`;
}

export function externalBookMetadataRoute(input: {
  source: 'google_books' | 'brasil_api';
  externalId: string;
}) {
  return {
    pathname: '/library/google-books/[volumeId]' as const,
    params: {
      volumeId: input.externalId,
      source: input.source,
    },
  };
}

export function readingCycleRoute(readingCycleId: string): `/reading/cycle/${string}` {
  return `/reading/cycle/${readingCycleId}`;
}

export function readingCycleLogRoute(readingCycleId: string): `/reading/cycle/${string}/log` {
  return `/reading/cycle/${readingCycleId}/log`;
}

export function readingLogEditRoute(readingLogId: string): `/reading/log/${string}/edit` {
  return `/reading/log/${readingLogId}/edit`;
}

export function readingHistoryCycleRoute(readingCycleId: string): `/reading/history/${string}` {
  return `/reading/history/${readingCycleId}`;
}

export function bookListRoute(bookListId: string): `/lists/${string}` {
  return `/lists/${bookListId}`;
}

export function bookListEditRoute(bookListId: string): `/lists/${string}/edit` {
  return `/lists/${bookListId}/edit`;
}

export function bookListAddBookRoute(bookListId: string): `/lists/${string}/add-book` {
  return `/lists/${bookListId}/add-book`;
}

export function wishlistItemRoute(bookListItemId: string): `/wishlist/item/${string}` {
  return `/wishlist/item/${bookListItemId}`;
}

export function readingGoalRoute(readingGoalId: string): `/goals/${string}` {
  return `/goals/${readingGoalId}`;
}

export function readingGoalEditRoute(readingGoalId: string): `/goals/${string}/edit` {
  return `/goals/${readingGoalId}/edit`;
}

export function readingGoalAddBooksRoute(readingGoalId: string): `/goals/${string}/add-books` {
  return `/goals/${readingGoalId}/add-books`;
}
