import { i18n } from '@/src/localization/i18n';
import { isValidCivilDate, toLocalCivilDate } from '../reading-formatters';

export interface StartReadingFormState {
  libraryBookId: string | null;
  editionId: string | null;
  bookCopyId: string | null;
  startedAt: string;
}

export interface StartReadingValidationResult {
  valid: boolean;
  message: string | null;
}

export function createInitialStartReadingForm(today = toLocalCivilDate()): StartReadingFormState {
  return {
    libraryBookId: null,
    editionId: null,
    bookCopyId: null,
    startedAt: today,
  };
}

export function validateStartReadingForm(
  form: StartReadingFormState,
  today = toLocalCivilDate(),
): StartReadingValidationResult {
  if (!form.libraryBookId) return invalid('reading.validation.selectBook');
  if (!form.editionId) return invalid('reading.validation.selectEdition');

  if (!isValidCivilDate(form.startedAt)) {
    return invalid('reading.validation.validStartDate');
  }

  if (form.startedAt > today) {
    return invalid('reading.validation.startDateFuture');
  }

  return {
    valid: true,
    message: null,
  };
}

function invalid(key: string): StartReadingValidationResult {
  return {
    valid: false,
    message: String(i18n.t(key)),
  };
}
