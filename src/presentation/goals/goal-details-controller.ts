import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ApplicationApi } from '@/src/application';

import { mapReadingGoalDetails } from './goals-mappers';
import type { ReadingGoalDetailsViewModel } from './goals-types';

export function useReadingGoalDetails(api: ApplicationApi, readingGoalId: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [viewModel, setViewModel] = useState<ReadingGoalDetailsViewModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  const viewModelRef = useRef<ReadingGoalDetailsViewModel | null>(null);

  const load = useCallback((mode: 'initial' | 'refresh') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    if (mode === 'refresh' && viewModelRef.current) setRefreshing(true);
    else setStatus('loading');

    Promise.resolve(api.goals.getGoalDetails(readingGoalId))
      .then((details) => {
        const next = mapReadingGoalDetails(details);
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
  }, [api, readingGoalId]);

  const cancelGoal = useCallback(() => {
    if (submitting) return Promise.resolve(false);
    setSubmitting(true);
    return Promise.resolve(api.goals.cancelGoal(readingGoalId))
      .then(() => {
        load('refresh');
        return true;
      })
      .catch((nextError: unknown) => {
        setError(nextError);
        return false;
      })
      .finally(() => setSubmitting(false));
  }, [api, load, readingGoalId, submitting]);

  const removeBook = useCallback((itemId: string) => {
    if (submitting) return;
    setSubmitting(true);
    Promise.resolve(api.goals.removeBook(itemId))
      .then(() => load('refresh'))
      .catch(setError)
      .finally(() => setSubmitting(false));
  }, [api, load, submitting]);

  useEffect(() => load('initial'), [load]);
  useFocusEffect(useCallback(() => {
    if (loadedRef.current) load('refresh');
  }, [load]));

  return {
    status,
    refreshing,
    viewModel,
    error,
    submitting,
    retry: () => load('initial'),
    refresh: () => load('refresh'),
    cancelGoal,
    removeBook,
  };
}

