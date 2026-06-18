export class DomainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {}

export class InvalidDateError extends ValidationError {}

export class FutureReadingDateError extends InvalidDateError {}

export class InvalidPageRangeError extends ValidationError {}

export class PageLimitExceededError extends InvalidPageRangeError {}

export class ActiveReadingCycleError extends DomainError {}

export class ReadingCycleNotActiveError extends DomainError {}

export class InvalidStatusTransitionError extends DomainError {}

export class EditionMismatchError extends DomainError {}

export class BookCopyMismatchError extends DomainError {}

export class DuplicateListItemError extends DomainError {}

export class InvalidWishlistItemError extends DomainError {}

export class InvalidGoalDateError extends InvalidDateError {}

export class ReadingGoalNotFoundError extends DomainError {}

