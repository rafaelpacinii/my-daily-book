import { describePublicError } from '@/src/application';

import { isValidCivilDate } from '../library-formatters';
import type {
  AddBookConfirmationState,
  AddBookValidationResult,
} from '../library-types';

export const defaultAddBookConfirmation: AddBookConfirmationState = {
  workMode: 'create',
  existingLibraryBookId: '',
  owned: true,
  format: 'physical',
  copyLabel: '',
  acquiredAt: '',
  notes: '',
};

export function validateAddBookConfirmation(
  form: AddBookConfirmationState,
): AddBookValidationResult {
  if (form.workMode !== 'create' && form.workMode !== 'existing') {
    return { valid: false, message: 'Choose how this book should be grouped.' };
  }

  if (form.workMode === 'existing' && form.existingLibraryBookId.trim().length === 0) {
    return { valid: false, message: 'Choose an existing work.' };
  }

  if (form.owned && form.format !== 'physical' && form.format !== 'digital') {
    return { valid: false, message: 'Choose a copy format.' };
  }

  if (!isValidCivilDate(form.acquiredAt)) {
    return { valid: false, message: 'Use YYYY-MM-DD for acquired date.' };
  }

  return { valid: true, message: null };
}

export function mapAddBookError(error: unknown): string {
  const descriptor = describePublicError(error);

  if (descriptor.category === 'conflict') return 'This edition or copy is already in your library.';
  if (descriptor.category === 'validation') return 'Check the book and copy details.';
  if (descriptor.category === 'network') return 'Unable to reach Google Books.';
  if (descriptor.category === 'external_service') return 'Unable to use this Google Books result.';
  return 'Unable to add this book.';
}
