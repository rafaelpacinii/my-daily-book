import type { db } from '../client';
import { DatabaseError, EntityConflictError } from '../errors';

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface Pagination {
  limit: number;
  offset: number;
}

export type Database = typeof db;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function getPagination(pagination: PaginationInput = {}): Pagination {
  const requestedLimit = pagination.limit ?? DEFAULT_LIMIT;
  const safeLimit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const safeOffset = Math.max(pagination.offset ?? 0, 0);

  return {
    limit: safeLimit,
    offset: safeOffset,
  };
}

export function nowTimestamp(): number {
  return Date.now();
}

export function firstOrNull<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}

export function mutationResult<T>(rows: T[]): T {
  const row = rows[0];

  if (!row) {
    throw new DatabaseError('The database mutation did not return a row.');
  }

  return row;
}

export function sanitizePersistenceRecord<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as T;
}

export function insertAndRead<T>(write: () => void, read: () => T | null): T {
  write();
  const row = read();

  if (!row) {
    throw new DatabaseError('The database mutation did not return a row.');
  }

  return row;
}

export function updateAndRead<T>(write: () => void, read: () => T | null): T | null {
  write();
  return read();
}

export function deleteAndRead<T>(read: () => T | null, write: () => void): T | null {
  const row = read();

  if (!row) {
    return null;
  }

  write();
  return row;
}

export function mapDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (isSqliteUniqueViolation(error)) {
    return new EntityConflictError('A database record with the same unique value already exists.', {
      cause: error,
    });
  }

  if (isSqliteForeignKeyViolation(error)) {
    return new DatabaseError('The database operation violates a foreign key constraint.', {
      cause: error,
    });
  }

  return new DatabaseError(buildDatabaseErrorMessage(error), { cause: error });
}

export function isDatabaseError(error: unknown): boolean {
  if (error instanceof DatabaseError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return DATABASE_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
}

export function runDatabaseOperation<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

function isSqliteUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('UNIQUE constraint failed');
}

function isSqliteForeignKeyViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('FOREIGN KEY constraint failed');
}

function buildDatabaseErrorMessage(error: unknown): string {
  const baseMessage = 'A database operation failed.';

  if (!isDevelopmentEnvironment() || !(error instanceof Error)) {
    return baseMessage;
  }

  return `${baseMessage} Cause: ${error.name}: ${error.message}`;
}

function isDevelopmentEnvironment(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }

  return process.env.NODE_ENV !== 'production';
}

const DATABASE_ERROR_PATTERNS = [
  /UNIQUE constraint failed/i,
  /FOREIGN KEY constraint failed/i,
  /NOT NULL constraint failed/i,
  /CHECK constraint failed/i,
  /datatype mismatch/i,
  /SQLITE_/i,
  /database/i,
  /no such table/i,
  /no such column/i,
  /has no column named/i,
  /table .* has no column/i,
];
