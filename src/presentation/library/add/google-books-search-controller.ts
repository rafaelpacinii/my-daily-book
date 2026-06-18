import { useCallback, useRef, useState } from 'react';

import type { ApplicationApi, GoogleBooksVolume } from '@/src/application';

import { mapGoogleBooksVolume } from '../library-mappers';
import type {
  GoogleBooksResultViewModel,
  GoogleBooksSearchState,
} from '../library-types';

export const googleBooksPageSize = 20;

export function mergeUniqueGoogleBooksItems(
  current: GoogleBooksResultViewModel[],
  next: GoogleBooksResultViewModel[],
): GoogleBooksResultViewModel[] {
  const seen = new Set(current.map((item) => metadataKey(item)));
  const merged = [...current];

  next.forEach((item) => {
    const key = metadataKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });

  return merged;
}

export function validateGoogleBooksQuery(query: string): string | null {
  return query.trim().length === 0 ? 'Enter a title, author or ISBN.' : null;
}

export function useGoogleBooksSearch(api: ApplicationApi): GoogleBooksSearchState {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<GoogleBooksResultViewModel[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [status, setStatus] = useState<GoogleBooksSearchState['status']>('idle');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const runSearch = useCallback((mode: 'first' | 'more') => {
    const searchQuery = mode === 'first' ? query.trim() : lastSubmittedQuery;
    const validationError = validateGoogleBooksQuery(searchQuery);

    if (validationError) {
      setError(new Error(validationError));
      setStatus('error');
      return;
    }

    if (mode === 'first') {
      if (loadingRef.current) return;
      loadingRef.current = true;
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setStatus('loading');
      setError(null);
      setLoadMoreError(null);
      setLastSubmittedQuery(searchQuery);
    } else {
      if (loadingMoreRef.current || items.length >= totalItems) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      setLoadMoreError(null);
    }

    const nextStartIndex = mode === 'first' ? 0 : startIndex + items.length;
    const signal = mode === 'first' ? abortRef.current?.signal : undefined;

    api.googleBooks.search({
      query: searchQuery,
      startIndex: nextStartIndex,
      maxResults: googleBooksPageSize,
      signal,
    })
      .then((result) => {
        const mapped = result.items.map(mapGoogleBooksVolume);
        setTotalItems(result.totalItems);
        setStartIndex(result.startIndex);
        setItems((current) => mode === 'first' ? mapped : mergeUniqueGoogleBooksItems(current, mapped));
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        if (signal?.aborted) return;
        if (mode === 'first') {
          setError(nextError);
          setStatus('error');
        } else {
          setLoadMoreError(nextError);
        }
      })
      .finally(() => {
        if (mode === 'first') {
          loadingRef.current = false;
        } else {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      });
  }, [api, items.length, lastSubmittedQuery, query, startIndex, totalItems]);

  const hasMore = items.length < totalItems;

  return {
    query,
    items,
    totalItems,
    startIndex,
    status,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    setQuery,
    submit: () => runSearch('first'),
    retry: () => runSearch('first'),
    loadMore: () => runSearch('more'),
  };
}

export function isUsableGoogleBooksVolume(volume: GoogleBooksVolume): boolean {
  return volume.googleBooksId.trim().length > 0 && volume.title.trim().length > 0;
}

function metadataKey(item: GoogleBooksResultViewModel): string {
  return `${item.source}:${item.externalId}`;
}
