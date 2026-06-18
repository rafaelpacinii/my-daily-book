import type { ApplicationApi, ListLibraryBooksInput } from '@/src/application';

import { mapLibraryBookSummary } from './library-mappers';
import type {
  LibraryBookViewModel,
  LibraryFilters,
  LibraryListViewModel,
  LibrarySort,
} from './library-types';

export const libraryPageSize = 20;

export const defaultLibraryFilters: LibraryFilters = {
  status: 'all',
  ownership: 'all',
  format: 'all',
  authorId: null,
};

export interface LoadLibraryPageOptions {
  api: ApplicationApi;
  query: string;
  filters: LibraryFilters;
  sort: LibrarySort;
  offset: number;
  limit?: number;
}

export function createLibraryQueryInput(
  options: Omit<LoadLibraryPageOptions, 'api'>,
): ListLibraryBooksInput {
  const trimmedQuery = options.query.trim();
  const sort = mapSort(options.sort);

  return {
    limit: options.limit ?? libraryPageSize,
    offset: options.offset,
    search: trimmedQuery.length > 0 ? trimmedQuery : undefined,
    status: options.filters.status === 'all' ? undefined : options.filters.status,
    owned: options.filters.ownership === 'all'
      ? undefined
      : options.filters.ownership === 'owned',
    format: options.filters.format === 'all' ? undefined : options.filters.format,
    authorId: options.filters.authorId ?? undefined,
    orderBy: sort.orderBy,
    orderDirection: sort.orderDirection,
  };
}

export function mergeUniqueLibraryItems(
  current: LibraryBookViewModel[],
  next: LibraryBookViewModel[],
): LibraryBookViewModel[] {
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];

  next.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  });

  return merged;
}

export function hasActiveLibraryFilters(
  query: string,
  filters: LibraryFilters,
): boolean {
  return (
    query.trim().length > 0 ||
    filters.status !== 'all' ||
    filters.ownership !== 'all' ||
    filters.format !== 'all' ||
    filters.authorId != null
  );
}

export async function loadLibraryPage(
  options: LoadLibraryPageOptions,
): Promise<LibraryListViewModel> {
  const result = await Promise.resolve(
    options.api.library.listBooks(createLibraryQueryInput(options)),
  );

  return {
    items: result.items.map(mapLibraryBookSummary),
    total: result.total,
    hasMore: result.hasMore,
    offset: result.offset,
    limit: result.limit,
  };
}

function mapSort(sort: LibrarySort): Pick<ListLibraryBooksInput, 'orderBy' | 'orderDirection'> {
  if (sort === 'title_asc') return { orderBy: 'title', orderDirection: 'asc' };
  if (sort === 'title_desc') return { orderBy: 'title', orderDirection: 'desc' };
  if (sort === 'last_read') return { orderBy: 'lastReadAt', orderDirection: 'desc' };
  return { orderBy: 'addedAt', orderDirection: 'desc' };
}
