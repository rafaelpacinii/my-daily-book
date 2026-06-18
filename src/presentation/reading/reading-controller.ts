import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ApplicationApi } from '@/src/application';

import { loadReadingHomeViewModel } from './reading-home-loader';
import type { ReadingHomeViewModel, ReadingScreenState } from './reading-types';

export { loadReadingHomeViewModel } from './reading-home-loader';

export function useReadingScreen(api: ApplicationApi): ReadingScreenState {
  const [status, setStatus] = useState<ReadingScreenState['status']>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [viewModel, setViewModel] = useState<ReadingHomeViewModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const viewModelRef = useRef<ReadingHomeViewModel | null>(null);

  const load = useCallback((mode: 'initial' | 'refresh') => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setError(null);
    if (mode === 'refresh' && viewModelRef.current) {
      setRefreshing(true);
    } else {
      setStatus('loading');
    }

    loadReadingHomeViewModel(api)
      .then((nextViewModel) => {
        if (!mountedRef.current) return;
        viewModelRef.current = nextViewModel;
        setViewModel(nextViewModel);
        setStatus('success');
        hasLoadedRef.current = true;
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current) return;
        setError(nextError);
        setStatus(viewModelRef.current ? 'success' : 'error');
      })
      .finally(() => {
        if (!mountedRef.current) return;
        loadingRef.current = false;
        setRefreshing(false);
      });
  }, [api]);

  useEffect(() => {
    mountedRef.current = true;
    load('initial');

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedRef.current) {
        load('refresh');
      }
    }, [load]),
  );

  return {
    status,
    refreshing,
    viewModel,
    error,
    retry: () => load('initial'),
    refresh: () => load('refresh'),
  };
}
