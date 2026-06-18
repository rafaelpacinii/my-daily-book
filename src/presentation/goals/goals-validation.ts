import { compareCivilDates, isValidCivilDate } from './goals-formatters';

export interface ReadingGoalFormState {
  name: string;
  description: string;
  startDate: string;
  targetDate: string;
}

export interface ReadingGoalBooksFormState {
  selectedBookIds: string[];
}

export function validateReadingGoalForm(form: ReadingGoalFormState) {
  const name = form.name.trim();
  const startDate = form.startDate.trim();
  const targetDate = form.targetDate.trim();

  if (!name) return invalid('Name is required.');
  if (!startDate) return invalid('Start date is required.');
  if (!targetDate) return invalid('Target date is required.');
  if (!isValidCivilDate(startDate)) return invalid('Use a valid start date in YYYY-MM-DD format.');
  if (!isValidCivilDate(targetDate)) return invalid('Use a valid target date in YYYY-MM-DD format.');
  if (compareCivilDates(targetDate, startDate) < 0) {
    return invalid('Target date cannot be before start date.');
  }

  return valid({
    name,
    description: form.description.trim() || null,
    startDate,
    targetDate,
  });
}

export function validateReadingGoalBooksForm(form: ReadingGoalBooksFormState) {
  const uniqueBookIds = [...new Set(form.selectedBookIds)];
  if (uniqueBookIds.length !== form.selectedBookIds.length) return invalid('A book can be selected only once.');

  return valid({
    bookIds: uniqueBookIds,
    recommendedMessage: uniqueBookIds.length === 0 ? 'A goal works best with at least one book.' : null,
  });
}

function valid<T>(input: T) {
  return { valid: true as const, message: null, input };
}

function invalid(message: string) {
  return { valid: false as const, message, input: null };
}

