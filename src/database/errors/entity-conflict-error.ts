import { DatabaseError } from './database-error';

export class EntityConflictError extends DatabaseError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'EntityConflictError';
  }
}
