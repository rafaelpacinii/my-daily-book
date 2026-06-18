import { InvalidGoalDateError, ValidationError } from '../../errors';
import { assertValidIsoDate, compareIsoDates } from '../../shared';

export function validateReadingGoalName(name: string): void {
  if (name.trim().length === 0) {
    throw new ValidationError('reading goal name is required.');
  }
}

export function validateReadingGoalDates(startDate: string, targetDate: string): void {
  assertValidIsoDate(startDate, 'goal start date');
  assertValidIsoDate(targetDate, 'goal target date');

  if (compareIsoDates(targetDate, startDate) < 0) {
    throw new InvalidGoalDateError('goal target date cannot be before start date.');
  }
}

export function assertNoDuplicateGoalBooks(libraryBookIds: string[]): void {
  if (new Set(libraryBookIds).size !== libraryBookIds.length) {
    throw new ValidationError('reading goal cannot contain the same book more than once.');
  }
}

