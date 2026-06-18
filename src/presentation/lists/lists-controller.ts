import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ApplicationApi } from '@/src/application';

import { loadListsHomeViewModel } from './lists-home-loader';
import type { ListsHomeViewModel } from './lists-types';

export { loadListsHomeViewModel } from './lists-home-loader';

export function useListsScreen(api: ApplicationApi) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [viewModel, setViewModel] = useState<ListsHomeViewModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  const viewModelRef = useRef<ListsHomeViewModel | null>(null);

  const load = useCallback((mode: 'initial' | 'refresh') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    if (mode === 'refresh' && viewModelRef.current) setRefreshing(true);
    else setStatus('loading');

    loadListsHomeViewModel(api)
      .then((next) => {
        viewModelRef.current = next;
        setViewModel(next);
        setStatus('success');
        loadedRef.current = true;
      })
      .catch((nextError: unknown) => {
        setError(nextError);
        setStatus(viewModelRef.current ? 'success' : 'error');
      })
      .finally(() => {
        loadingRef.current = false;
        setRefreshing(false);
      });
  }, [api]);

  useEffect(() => load('initial'), [load]);
  useFocusEffect(useCallback(() => {
    if (loadedRef.current) load('refresh');
  }, [load]));

  return {
    status,
    refreshing,
    viewModel,
    error,
    retry: () => load('initial'),
    refresh: () => load('refresh'),
  };
}
