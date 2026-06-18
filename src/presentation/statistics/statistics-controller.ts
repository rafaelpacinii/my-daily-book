import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { StatisticsApi } from '@/src/application';

import { loadStatisticsOverviewViewModel } from './statistics-loader';
import {
  resolveStatisticsPeriod,
  validateCustomStatisticsPeriod,
} from './statistics-periods';
import type {
  BookStatisticsSortKey,
  StatisticsCustomPeriodFormState,
  StatisticsOverviewViewModel,
  StatisticsPeriodKey,
} from './statistics-types';

export { loadStatisticsOverviewViewModel } from './statistics-loader';

export function useStatisticsScreen(api: StatisticsApi) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'refreshing'>('idle');
  const [viewModel, setViewModel] = useState<StatisticsOverviewViewModel | null>(null);
  const [periodKey, setPeriodKey] = useState<StatisticsPeriodKey>('30d');
  const [bookSort, setBookSort] = useState<BookStatisticsSortKey>('pages');
  const [customForm, setCustomForm] = useState<StatisticsCustomPeriodFormState>({
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState<unknown>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const requestRef = useRef(0);
  const viewModelRef = useRef<StatisticsOverviewViewModel | null>(null);

  const period = useMemo(
    () => resolveStatisticsPeriod(periodKey, undefined, customForm),
    [customForm, periodKey],
  );

  const load = useCallback((mode: 'initial' | 'refresh') => {
    if (periodKey === 'custom') {
      const validation = validateCustomStatisticsPeriod(customForm);
      if (!validation.valid) {
        setFormError(validation.message);
        return;
      }
      setFormError(null);
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setError(null);
    setStatus(mode === 'refresh' && viewModelRef.current ? 'refreshing' : 'loading');

    loadStatisticsOverviewViewModel(api, period, bookSort)
      .then((next) => {
        if (requestRef.current !== requestId) return;
        viewModelRef.current = next;
        setViewModel(next);
        setStatus('success');
        loadedRef.current = true;
      })
      .catch((nextError: unknown) => {
        if (requestRef.current !== requestId) return;
        setError(nextError);
        setStatus(viewModelRef.current ? 'success' : 'error');
      });
  }, [api, bookSort, customForm, period, periodKey]);

  useEffect(() => load('initial'), [load]);
  useFocusEffect(useCallback(() => {
    if (loadedRef.current) load('refresh');
  }, [load]));

  return {
    status,
    refreshing: status === 'refreshing',
    viewModel,
    periodKey,
    bookSort,
    customForm,
    error,
    formError,
    setPeriodKey,
    setBookSort,
    setCustomForm,
    retry: () => load('initial'),
    refresh: () => load('refresh'),
  };
}

