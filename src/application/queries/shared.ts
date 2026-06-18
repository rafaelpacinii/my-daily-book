import { ValidationError } from '@/src/domain/errors';

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface Pagination {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> extends Pagination {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const DEFAULT_QUERY_LIMIT = 50;
export const MAX_QUERY_LIMIT = 200;

export function getPagination(input: PaginationInput = {}): Pagination {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_QUERY_LIMIT, 1), MAX_QUERY_LIMIT);
  const offset = Math.max(input.offset ?? 0, 0);

  return { limit, offset };
}

export function paginateItems<T>(items: T[], input: PaginationInput = {}): PaginatedResult<T> {
  const { limit, offset } = getPagination(input);
  const page = items.slice(offset, offset + limit);

  return {
    items: page,
    total: items.length,
    limit,
    offset,
    hasMore: offset + page.length < items.length,
  };
}

export function validateDateRange(input: DateRange): void {
  if (input.endDate < input.startDate) {
    throw new ValidationError('endDate must be greater than or equal to startDate.');
  }
}

