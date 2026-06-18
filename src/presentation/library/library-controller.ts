import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ApplicationApi } from '@/src/application';

import {
  defaultLibraryFilters,
  libraryPageSize,
  loadLibraryPage,
  mergeUniqueLibraryItems,
} from './library-controller-core';
import type {
  FormatFilter,
  LibraryBookViewModel,
  LibraryFilters,
  LibraryScreenState,
  LibrarySort,
  LibraryStatusFilter,
  OwnershipFilter,
} from './library-types';

export function useLibraryScreen(api: ApplicationApi): LibraryScreenState {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<LibraryFilters>(defaultLibraryFilters);
  const [sort, setSort] = useState<LibrarySort>('recently_added');
  const [items, setItems] = useState<LibraryBookViewModel[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(libraryPageSize);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<LibraryScreenState['status']>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const loadingInitialRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadFirstPage = useCallback((mode: 'initial' | 'refresh' = 'initial') => {
    if (loadingInitialRef.current) return;

    loadingInitialRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadMoreError(null);
    setError(null);
    if (mode === 'refresh' && items.length > 0) {
      setRefreshing(true);
    } else {
      setStatus('loading');
    }

    loadLibraryPage({
      api,
      query: debouncedQuery,
      filters,
      sort,
      offset: 0,
      limit: libraryPageSize,
    })
      .then((page) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setItems(page.items);
        setTotal(page.total);
        setOffset(page.offset + page.items.length);
        setLimit(page.limit);
        setHasMore(page.hasMore);
        setStatus('success');
        hasLoadedRef.current = true;
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setError(nextError);
        setStatus(items.length > 0 ? 'success' : 'error');
      })
      .finally(() => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        loadingInitialRef.current = false;
        setRefreshing(false);
      });
  }, [api, debouncedQuery, filters, items.length, sort]);

  useEffect(() => {
    mountedRef.current = true;
    loadFirstPage('initial');

    return () => {
      mountedRef.current = false;
    };
  }, [loadFirstPage]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedRef.current) {
        loadFirstPage('refresh');
      }
    }, [loadFirstPage]),
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || loadingInitialRef.current) return;

    loadingMoreRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadingMore(true);
    setLoadMoreError(null);

    loadLibraryPage({
      api,
      query: debouncedQuery,
      filters,
      sort,
      offset,
      limit,
    })
      .then((page) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setItems((current) => mergeUniqueLibraryItems(current, page.items));
        setTotal(page.total);
        setOffset(page.offset + page.items.length);
        setLimit(page.limit);
        setHasMore(page.hasMore);
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setLoadMoreError(nextError);
      })
      .finally(() => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [api, debouncedQuery, filters, hasMore, limit, offset, sort]);

  const clearQueryAndFilters = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setFilters(defaultLibraryFilters);
  }, []);

  const state = useMemo<LibraryScreenState>(() => ({
    query,
    debouncedQuery,
    filters,
    sort,
    items,
    total,
    offset,
    limit,
    hasMore,
    status,
    refreshing,
    loadingMore,
    error,
    loadMoreError,
    setQuery,
    clearQueryAndFilters,
    setStatusFilter: (nextStatus: LibraryStatusFilter) =>
      setFilters((current) => ({ ...current, status: nextStatus })),
    setOwnershipFilter: (ownership: OwnershipFilter) =>
      setFilters((current) => ({ ...current, ownership })),
    setFormatFilter: (format: FormatFilter) =>
      setFilters((current) => ({ ...current, format })),
    setSort,
    retry: () => loadFirstPage('initial'),
    refresh: () => loadFirstPage('refresh'),
    loadMore,
  }), [
    clearQueryAndFilters,
    debouncedQuery,
    error,
    filters,
    hasMore,
    items,
    limit,
    loadFirstPage,
    loadMore,
    loadMoreError,
    loadingMore,
    offset,
    query,
    refreshing,
    sort,
    status,
    total,
  ]);

  return state;
}

export {
  createLibraryQueryInput,
  defaultLibraryFilters,
  hasActiveLibraryFilters,
  libraryPageSize,
  loadLibraryPage,
  mergeUniqueLibraryItems,
} from './library-controller-core';
