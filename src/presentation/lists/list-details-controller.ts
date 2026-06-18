import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ApplicationApi } from '@/src/application';

import { mapBookListDetails } from './lists-mappers';
import type { BookListDetailsViewModel } from './lists-types';

export function useBookListDetails(api: ApplicationApi, bookListId: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [viewModel, setViewModel] = useState<BookListDetailsViewModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);

  const load = useCallback((mode: 'initial' | 'refresh') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    if (mode === 'refresh' && viewModel) setRefreshing(true);
    else setStatus('loading');

    Promise.resolve(api.lists.getListDetails(bookListId))
      .then((details) => {
        setViewModel(mapBookListDetails(details));
        setStatus('success');
        loadedRef.current = true;
      })
      .catch((nextError: unknown) => {
        setError(nextError);
        setStatus(viewModel ? 'success' : 'error');
      })
      .finally(() => {
        loadingRef.current = false;
        setRefreshing(false);
      });
  }, [api, bookListId, viewModel]);

  const removeItem = useCallback((id: string) => {
    if (submitting) return;
    setSubmitting(true);
    Promise.resolve(api.lists.removeItem(id))
      .then(() => load('refresh'))
      .catch(setError)
      .finally(() => setSubmitting(false));
  }, [api, load, submitting]);

  const moveItem = useCallback((id: string, direction: -1 | 1) => {
    if (!viewModel || submitting) return;
    const index = viewModel.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= viewModel.items.length) return;

    const next = [...viewModel.items];
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;

    setSubmitting(true);
    Promise.resolve(api.lists.reorderItems(next.map((item, position) => ({ id: item.id, position }))))
      .then(() => load('refresh'))
      .catch(setError)
      .finally(() => setSubmitting(false));
  }, [api, load, submitting, viewModel]);

  const deleteList = useCallback(() => {
    if (submitting) return Promise.resolve(false);
    setSubmitting(true);
    return Promise.resolve(api.lists.deleteList(bookListId))
      .then(() => true)
      .catch((nextError: unknown) => {
        setError(nextError);
        return false;
      })
      .finally(() => setSubmitting(false));
  }, [api, bookListId, submitting]);

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
    removeItem,
    moveItem,
    deleteList,
  };
}
