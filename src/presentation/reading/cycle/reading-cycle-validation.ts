import { i18n } from '@/src/localization/i18n';
import { isValidCivilDate, toLocalCivilDate } from '../reading-formatters';

export interface CompleteReadingFormState {
  finishedAt: string;
  rating: string;
  notes: string;
}

export interface DropReadingFormState {
  droppedAt: string;
  notes: string;
}

export function validateCompleteReadingForm(
  form: CompleteReadingFormState,
  today = toLocalCivilDate(),
): { valid: boolean; message: string | null; rating: number | null; notes: string | null } {
  if (!isValidCivilDate(form.finishedAt)) {
    return invalid('reading.validation.validCompletionDate');
  }

  if (form.finishedAt > today) {
    return invalid('reading.validation.completionDateFuture');
  }

  const rating = form.rating.trim() ? Number(form.rating.trim()) : null;
  if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return invalid('reading.validation.ratingInvalid');
  }

  const notes = form.notes.trim();

  return {
    valid: true,
    message: null,
    rating,
    notes: notes || null,
  };
}

export function validateDropReadingForm(
  form: DropReadingFormState,
  today = toLocalCivilDate(),
): { valid: boolean; message: string | null; notes: string | null } {
  if (!isValidCivilDate(form.droppedAt)) {
    return {
      valid: false,
      message: String(i18n.t('reading.validation.validDropDate')),
      notes: null,
    };
  }

  if (form.droppedAt > today) {
    return {
      valid: false,
      message: String(i18n.t('reading.validation.dropDateFuture')),
      notes: null,
    };
  }

  const notes = form.notes.trim();

  return {
    valid: true,
    message: null,
    notes: notes || null,
  };
}

function invalid(key: string) {
  return {
    valid: false,
    message: String(i18n.t(key)),
    rating: null,
    notes: null,
  };
}
