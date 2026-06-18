import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApplicationApi } from '@/src/application';

import { createHomeViewModel } from './home-mappers';
import { toLocalCivilDate } from './home-formatters';
import type { HomeState, HomeStatus, HomeViewModel } from './home-types';

export interface HomeControllerOptions {
  api: ApplicationApi;
  getToday?: () => string;
}

export async function loadHomeViewModel({
  api,
  getToday = toLocalCivilDate,
}: HomeControllerOptions): Promise<HomeViewModel> {
  const today = getToday();
  const [
    libraryOverview,
    currentlyReading,
    todaySummary,
    streak,
    activeGoals,
  ] = await Promise.all([
    Promise.resolve(api.library.getOverview()),
    Promise.resolve(api.library.listCurrentlyReadingBooks()),
    Promise.resolve(api.reading.getDailySummary(today)),
    Promise.resolve(api.statistics.getReadingStreak(today)),
    Promise.resolve(api.goals.getActiveGoals()),
  ]);

  return createHomeViewModel({
    libraryOverview,
    currentlyReading,
    todaySummary,
    streak,
    activeGoals,
    today,
  });
}

export function useHomeScreen(options: HomeControllerOptions): HomeState {
  const { api, getToday } = options;
  const [status, setStatus] = useState<HomeStatus>('idle');
  const [viewModel, setViewModel] = useState<HomeViewModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const viewModelRef = useRef<HomeViewModel | null>(null);

  const load = useCallback((mode: 'initial' | 'refresh') => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setStatus(mode === 'refresh' && viewModelRef.current ? 'refreshing' : 'loading');
    setError(null);

    loadHomeViewModel({ api, getToday })
      .then((nextViewModel) => {
        if (!mountedRef.current) return;
        viewModelRef.current = nextViewModel;
        setViewModel(nextViewModel);
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current) return;
        setError(nextError);
        setStatus(viewModelRef.current ? 'success' : 'error');
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, [api, getToday]);

  useEffect(() => {
    mountedRef.current = true;
    load('initial');

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const retry = useCallback(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => {
    load('refresh');
  }, [load]);

  return {
    status,
    viewModel,
    error,
    retry,
    refresh,
  };
}
