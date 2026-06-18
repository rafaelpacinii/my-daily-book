import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ApplicationApi } from '@/src/application';

import { mapReadingHistoryItem } from '../reading-mappers';
import type {
  ReadingCycleStatusView,
  ReadingHistoryItemViewModel,
  ReadingHistoryState,
} from '../reading-types';

const historyPageSize = 20;

export function useReadingHistory(api: ApplicationApi): ReadingHistoryState {
  const [items, setItems] = useState<ReadingHistoryItemViewModel[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<ReadingHistoryState['status']>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);
  const [statusFilter, setStatusFilter] = useState<ReadingCycleStatusView | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const mountedRef = useRef(true);
  const loadingFirstRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadFirstPage = useCallback((mode: 'initial' | 'refresh' = 'initial') => {
    if (loadingFirstRef.current) return;

    loadingFirstRef.current = true;
    setError(null);
    setLoadMoreError(null);
    if (mode === 'refresh' && items.length > 0) {
      setRefreshing(true);
    } else {
      setStatus('loading');
    }

    const page = api.reading.listHistory({
      status: statusFilter === 'all' ? undefined : statusFilter,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      orderBy: 'lastReadAt',
      orderDirection: 'desc',
      offset: 0,
      limit: historyPageSize,
    });

    Promise.resolve(page)
      .then((nextPage) => {
        if (!mountedRef.current) return;
        setItems(nextPage.items.map(mapReadingHistoryItem));
        setTotal(nextPage.total);
        setOffset(nextPage.offset + nextPage.items.length);
        setHasMore(nextPage.hasMore);
        setStatus('success');
        hasLoadedRef.current = true;
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current) return;
        setError(nextError);
        setStatus(items.length > 0 ? 'success' : 'error');
      })
      .finally(() => {
        if (!mountedRef.current) return;
        loadingFirstRef.current = false;
        setRefreshing(false);
      });
  }, [api, endDate, items.length, startDate, statusFilter]);

  useEffect(() => {
    mountedRef.current = true;
    loadFirstPage('initial');

    return () => {
      mountedRef.current = false;
    };
  }, [loadFirstPage]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedRef.current) loadFirstPage('refresh');
    }, [loadFirstPage]),
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || loadingFirstRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    const page = api.reading.listHistory({
      status: statusFilter === 'all' ? undefined : statusFilter,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      orderBy: 'lastReadAt',
      orderDirection: 'desc',
      offset,
      limit: historyPageSize,
    });

    Promise.resolve(page)
      .then((nextPage) => {
        if (!mountedRef.current) return;
        setItems((current) => [...current, ...nextPage.items.map(mapReadingHistoryItem)]);
        setTotal(nextPage.total);
        setOffset(nextPage.offset + nextPage.items.length);
        setHasMore(nextPage.hasMore);
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current) return;
        setLoadMoreError(nextError);
      })
      .finally(() => {
        if (!mountedRef.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [api, endDate, hasMore, offset, startDate, statusFilter]);

  return {
    status,
    refreshing,
    loadingMore,
    items,
    total,
    hasMore,
    error,
    loadMoreError,
    statusFilter,
    startDate,
    endDate,
    setStatusFilter,
    setStartDate,
    setEndDate,
    retry: () => loadFirstPage('initial'),
    refresh: () => loadFirstPage('refresh'),
    loadMore,
  };
}
