import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApplicationApi } from '@/src/application';

import { isValidCivilDate, trimOptional } from '../library-formatters';
import { mapLibraryBookDetails } from '../library-mappers';
import type {
  AddCopyFormState,
  LibraryBookDetailsViewModel,
} from '../library-types';

export const defaultAddCopyForm: AddCopyFormState = {
  editionId: '',
  format: 'physical',
  label: '',
  acquiredAt: '',
  notes: '',
};

export interface LibraryBookDetailsState {
  status: 'idle' | 'loading' | 'success' | 'error';
  details: LibraryBookDetailsViewModel | null;
  error: unknown;
  addCopyForm: AddCopyFormState;
  addCopyError: string | null;
  submittingCopy: boolean;
  setAddCopyForm: (form: AddCopyFormState) => void;
  retry: () => void;
  submitCopy: () => void;
  removeCopy: (copyId: string) => void;
}

export function validateAddCopyForm(form: AddCopyFormState): string | null {
  if (form.editionId.trim().length === 0) return 'Choose an edition.';
  if (form.format !== 'physical' && form.format !== 'digital') return 'Choose a format.';
  if (!isValidCivilDate(form.acquiredAt)) return 'Use YYYY-MM-DD for acquired date.';
  return null;
}

export function useLibraryBookDetails(
  api: ApplicationApi,
  libraryBookId: string,
): LibraryBookDetailsState {
  const [status, setStatus] = useState<LibraryBookDetailsState['status']>('idle');
  const [details, setDetails] = useState<LibraryBookDetailsViewModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [addCopyForm, setAddCopyForm] = useState<AddCopyFormState>(defaultAddCopyForm);
  const [addCopyError, setAddCopyError] = useState<string | null>(null);
  const [submittingCopy, setSubmittingCopy] = useState(false);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const load = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setStatus('loading');
    setError(null);

    Promise.resolve(api.library.getBookDetails(libraryBookId))
      .then((nextDetails) => {
        if (!mountedRef.current) return;
        const viewModel = mapLibraryBookDetails(nextDetails);
        setDetails(viewModel);
        setAddCopyForm((current) => ({
          ...current,
          editionId: current.editionId || viewModel.editions[0]?.id || '',
        }));
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        if (!mountedRef.current) return;
        setError(nextError);
        setStatus('error');
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, [api, libraryBookId]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const submitCopy = useCallback(() => {
    const validationError = validateAddCopyForm(addCopyForm);
    setAddCopyError(validationError);
    if (validationError || submittingCopy) return;

    setSubmittingCopy(true);
    Promise.resolve(api.library.addCopy({
      libraryBookId,
      editionId: addCopyForm.editionId,
      format: addCopyForm.format,
      label: trimOptional(addCopyForm.label),
      acquiredAt: trimOptional(addCopyForm.acquiredAt),
      notes: trimOptional(addCopyForm.notes),
    }))
      .then(() => {
        if (!mountedRef.current) return;
        setAddCopyForm(defaultAddCopyForm);
        load();
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setAddCopyError('Unable to add this copy.');
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setSubmittingCopy(false);
      });
  }, [addCopyForm, api, libraryBookId, load, submittingCopy]);

  const removeCopy = useCallback((copyId: string) => {
    Promise.resolve(api.library.removeCopy(copyId))
      .then(load)
      .catch(() => setAddCopyError('Unable to remove this copy.'));
  }, [api, load]);

  return {
    status,
    details,
    error,
    addCopyForm,
    addCopyError,
    submittingCopy,
    setAddCopyForm,
    retry: load,
    submitCopy,
    removeCopy,
  };
}
