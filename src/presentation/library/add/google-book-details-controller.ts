import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';

import type { ApplicationApi, BookMetadata, BookMetadataSource, GoogleBooksVolume } from '@/src/application';

import { trimOptional } from '../library-formatters';
import {
  mapGoogleBookDetails,
  mapLibraryBookSummary,
  mapPossibleEdition,
} from '../library-mappers';
import type {
  AddBookConfirmationState,
  GoogleBookDetailsViewModel,
  LibraryBookViewModel,
  PossibleEditionViewModel,
} from '../library-types';
import {
  defaultAddBookConfirmation,
  mapAddBookError,
  validateAddBookConfirmation,
} from './add-book-validation';

export interface GoogleBookDetailsState {
  status: 'idle' | 'loading' | 'success' | 'error';
  volume: BookMetadata | null;
  viewModel: GoogleBookDetailsViewModel | null;
  possibleEditions: PossibleEditionViewModel[];
  possibleEditionsStatus: 'idle' | 'loading' | 'success' | 'error';
  possibleEditionsError: unknown;
  existingWorks: LibraryBookViewModel[];
  form: AddBookConfirmationState;
  formMessage: string | null;
  submitStatus: 'idle' | 'submitting' | 'success' | 'error';
  error: unknown;
  setForm: (form: AddBookConfirmationState) => void;
  retry: () => void;
  loadPossibleEditions: () => void;
  submit: () => void;
}

export function useGoogleBookDetails(
  api: ApplicationApi,
  volumeId: string,
  source: BookMetadataSource = 'google_books',
): GoogleBookDetailsState {
  const [status, setStatus] = useState<GoogleBookDetailsState['status']>('idle');
  const [volume, setVolume] = useState<BookMetadata | null>(null);
  const [viewModel, setViewModel] = useState<GoogleBookDetailsViewModel | null>(null);
  const [possibleEditions, setPossibleEditions] = useState<PossibleEditionViewModel[]>([]);
  const [possibleEditionsStatus, setPossibleEditionsStatus] =
    useState<GoogleBookDetailsState['possibleEditionsStatus']>('idle');
  const [possibleEditionsError, setPossibleEditionsError] = useState<unknown>(null);
  const [existingWorks, setExistingWorks] = useState<LibraryBookViewModel[]>([]);
  const [form, setForm] = useState<AddBookConfirmationState>(defaultAddBookConfirmation);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] =
    useState<GoogleBookDetailsState['submitStatus']>('idle');
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    setStatus('loading');
    setError(null);

    Promise.all([
      api.googleBooks.getMetadata({ source, externalId: volumeId, signal: abortController.signal }),
      Promise.resolve(api.library.listBooks({ limit: 50, orderBy: 'title', orderDirection: 'asc' })),
    ])
      .then(([nextVolume, existingBooks]) => {
        setVolume(nextVolume);
        setViewModel(mapGoogleBookDetails(nextVolume));
        setExistingWorks(existingBooks.items.map(mapLibraryBookSummary));
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        if (abortController.signal.aborted) return;
        setError(nextError);
        setStatus('error');
      });
  }, [api, source, volumeId]);

  useEffect(() => {
    load();

    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const loadPossibleEditions = useCallback(() => {
    if (!volume || volume.source !== 'google_books' || possibleEditionsStatus === 'loading') return;

    const abortController = new AbortController();
    setPossibleEditionsStatus('loading');
    setPossibleEditionsError(null);

    api.googleBooks.searchPossibleEditions(volume as GoogleBooksVolume, { signal: abortController.signal })
      .then((results) => {
        setPossibleEditions(results.map(mapPossibleEdition));
        setPossibleEditionsStatus('success');
      })
      .catch((nextError: unknown) => {
        if (abortController.signal.aborted) return;
        setPossibleEditionsError(nextError);
        setPossibleEditionsStatus('error');
      });
  }, [api, possibleEditionsStatus, volume]);

  const submit = useCallback(() => {
    const validation = validateAddBookConfirmation(form);
    setFormMessage(validation.message);
    if (!validation.valid || !volume || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitStatus('submitting');

    const resolveWork = form.workMode === 'create'
      ? Promise.resolve({
          kind: 'create' as const,
          data: {
            title: volume.title,
            originalTitle: null,
            description: volume.description,
            originalLanguage: volume.language,
            firstPublishedDate: volume.publishedDate,
          },
        })
      : Promise.resolve(api.library.getBookDetails(form.existingLibraryBookId))
          .then((details) => ({ kind: 'existing' as const, id: details.work.id }));

    resolveWork
      .then((work) => {
        const input = api.googleBooks.prepareLibraryInput(volume, {
          metadataFetchedAt: Date.now(),
          work,
        });

        return api.library.addBook({
          ...input,
          copy: form.owned
            ? {
                format: form.format,
                label: trimOptional(form.copyLabel),
                acquiredAt: trimOptional(form.acquiredAt),
                notes: trimOptional(form.notes),
              }
            : undefined,
        });
      })
      .then((result) => {
        setSubmitStatus('success');
        router.replace(`/library/${result.libraryBook.id}`);
      })
      .catch((nextError: unknown) => {
        setFormMessage(mapAddBookError(nextError));
        setSubmitStatus('error');
      })
      .finally(() => {
        submittingRef.current = false;
      });
  }, [api, form, volume]);

  return {
    status,
    volume,
    viewModel,
    possibleEditions,
    possibleEditionsStatus,
    possibleEditionsError,
    existingWorks,
    form,
    formMessage,
    submitStatus,
    error,
    setForm,
    retry: load,
    loadPossibleEditions,
    submit,
  };
}
