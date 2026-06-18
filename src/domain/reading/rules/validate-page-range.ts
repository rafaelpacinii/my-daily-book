import { InvalidPageRangeError, PageLimitExceededError, ValidationError } from '../../errors';

export function validatePageRange(
  startPage: number,
  endPage: number,
  pageCount?: number | null,
): void {
  if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) {
    throw new InvalidPageRangeError('page range must use integer page numbers.');
  }

  if (startPage < 1) {
    throw new InvalidPageRangeError('start page must be greater than or equal to 1.');
  }

  if (endPage < startPage) {
    throw new InvalidPageRangeError('end page must be greater than or equal to start page.');
  }

  if (pageCount != null) {
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      throw new ValidationError('page count must be a positive integer when provided.');
    }

    if (endPage > pageCount) {
      throw new PageLimitExceededError('end page cannot be greater than page count.');
    }
  }
}

