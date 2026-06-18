import { EntityConflictError, EntityNotFoundError } from '@/src/database/errors';
import { BackupError } from '@/src/domain/backup';
import { DomainError, ValidationError } from '@/src/domain/errors';
import {
  GoogleAuthError,
  GoogleAuthRequiredError,
  GoogleDriveNetworkError,
} from '@/src/infrastructure/google-drive/google-drive-errors';
import {
  GoogleBooksError,
  GoogleBooksNetworkError,
} from '@/src/infrastructure/google-books/google-books-errors';

export type PublicErrorCategory =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'authentication'
  | 'network'
  | 'external_service'
  | 'database'
  | 'backup'
  | 'unknown';

export interface PublicErrorDescriptor {
  category: PublicErrorCategory;
  name: string;
}

export function describePublicError(error: unknown): PublicErrorDescriptor {
  if (error instanceof ValidationError) return describe(error, 'validation');
  if (error instanceof EntityNotFoundError) return describe(error, 'not_found');
  if (error instanceof EntityConflictError) return describe(error, 'conflict');
  if (error instanceof GoogleAuthRequiredError || error instanceof GoogleAuthError) {
    return describe(error, 'authentication');
  }
  if (error instanceof GoogleBooksNetworkError || error instanceof GoogleDriveNetworkError) {
    return describe(error, 'network');
  }
  if (error instanceof GoogleBooksError) return describe(error, 'external_service');
  if (error instanceof BackupError) return describe(error, 'backup');
  if (error instanceof DomainError) return describe(error, 'validation');

  return {
    category: 'unknown',
    name: error instanceof Error ? error.name : 'UnknownError',
  };
}

function describe(error: Error, category: PublicErrorCategory): PublicErrorDescriptor {
  return {
    category,
    name: error.name,
  };
}
