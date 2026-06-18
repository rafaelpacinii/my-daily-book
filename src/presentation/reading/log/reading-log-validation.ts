import { i18n } from '@/src/localization/i18n';
import {
  durationPartsToSeconds,
  isValidCivilDate,
  parsePositiveInteger,
  toLocalCivilDate,
} from '../reading-formatters';

export interface ReadingLogFormState {
  readingDate: string;
  startPage: string;
  endPage: string;
  durationHours: string;
  durationMinutes: string;
  notes: string;
}

export interface ReadingLogValidationResult {
  valid: boolean;
  message: string | null;
  input: {
    readingDate: string;
    startPage: number;
    endPage: number;
    durationSeconds: number | null;
    notes: string | null;
  } | null;
}

export function createInitialReadingLogForm(input: {
  today?: string;
  previousEndPage?: number | null;
  log?: {
    readingDate: string;
    startPage: number;
    endPage: number;
    durationSeconds: number | null;
    notes: string | null;
  } | null;
}): ReadingLogFormState {
  if (input.log) {
    const hours = input.log.durationSeconds
      ? `${Math.floor(input.log.durationSeconds / 3600)}`
      : '';
    const minutes = input.log.durationSeconds
      ? `${Math.round((input.log.durationSeconds % 3600) / 60)}`
      : '';

    return {
      readingDate: input.log.readingDate,
      startPage: `${input.log.startPage}`,
      endPage: `${input.log.endPage}`,
      durationHours: hours,
      durationMinutes: minutes,
      notes: input.log.notes ?? '',
    };
  }

  return {
    readingDate: input.today ?? toLocalCivilDate(),
    startPage: `${(input.previousEndPage ?? 0) + 1}`,
    endPage: '',
    durationHours: '',
    durationMinutes: '',
    notes: '',
  };
}

export function validateReadingLogForm(
  form: ReadingLogFormState,
  options: { pageCount?: number | null; today?: string } = {},
): ReadingLogValidationResult {
  const today = options.today ?? toLocalCivilDate();
  const startPage = parsePositiveInteger(form.startPage);
  const endPage = parsePositiveInteger(form.endPage);
  const durationSeconds = durationPartsToSeconds(form.durationHours, form.durationMinutes);
  const notes = form.notes.trim();

  if (!isValidCivilDate(form.readingDate)) {
    return invalid('reading.validation.validReadingDate');
  }

  if (form.readingDate > today) {
    return invalid('reading.validation.readingDateFuture');
  }

  if (startPage == null) {
    return invalid('reading.validation.startPageRequired');
  }

  if (endPage == null) {
    return invalid('reading.validation.endPageRequired');
  }

  if (endPage < startPage) {
    return invalid('reading.validation.endPageRange');
  }

  if (options.pageCount != null && endPage > options.pageCount) {
    return invalid('reading.validation.endPageLimit', { pageCount: options.pageCount });
  }

  if (durationSeconds == null && hasInvalidDurationInput(form)) {
    return invalid('reading.validation.durationInvalid');
  }

  return {
    valid: true,
    message: null,
    input: {
      readingDate: form.readingDate,
      startPage,
      endPage,
      durationSeconds,
      notes: notes || null,
    },
  };
}

function invalid(key: string, options?: Record<string, unknown>): ReadingLogValidationResult {
  return {
    valid: false,
    message: String(i18n.t(key, options)),
    input: null,
  };
}

function hasInvalidDurationInput(form: ReadingLogFormState): boolean {
  const hasInput = form.durationHours.trim() !== '' || form.durationMinutes.trim() !== '';
  if (!hasInput) return false;

  const hours = form.durationHours.trim() ? Number(form.durationHours.trim()) : 0;
  const minutes = form.durationMinutes.trim() ? Number(form.durationMinutes.trim()) : 0;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return true;
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return true;
  if (hours < 0 || minutes < 0) return true;

  return hours !== 0 || minutes !== 0;
}
